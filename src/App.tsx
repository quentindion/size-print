import { ChangeEvent, DragEvent, Fragment, useEffect, useReducer, useRef, useState } from "react"
import { Switch } from "@headlessui/react";
import { Image, ImageDown, Printer, RectangleHorizontal, RectangleVertical } from "lucide-react";

type Worksheet = {
    layout: 'portrait' | 'landscape'
    size: [number, number]
    padding: string
    border?: boolean
}

type Picture = {
    width: string
    limit: string
    src?: string
    dragging: boolean
}

function App() {

    const [, forceRender] = useReducer(o => !o, true);
    
    const worksheetRef = useRef<HTMLDivElement>(null);
    const pictureRef = useRef<HTMLImageElement>(null);

    const [worksheet, setWorksheet] = useState<Worksheet>({
        layout: 'portrait',
        size: [21, 29.7],
        padding: '0.5',
        border: true
    });

    const [picture, setPicture] = useState<Picture>({
        width: '100',
        limit: '20',
        dragging: false
    });

    const aspectRatio = worksheet.layout === 'portrait' ? (worksheet.size[0]/worksheet.size[1]) : (worksheet.size[1]/worksheet.size[0]);

    const [pictureCount, setPictureCount] = useState([0, 0, 0]);

    useEffect(() => {

        if(worksheetRef.current && pictureRef.current) {

            const worksheetStyles = getComputedStyle(worksheetRef.current);
            const worksheetWidth = parseInt(worksheetStyles?.width) - (parseInt(worksheetStyles?.padding) * 2);
            const worksheetHeight = parseInt(worksheetStyles?.height) - (parseInt(worksheetStyles?.padding) * 2);
            
            const pictureStyles = getComputedStyle(pictureRef.current);
            const pictureWidth = parseInt(pictureStyles?.width);
            const pictureHeight = parseInt(pictureStyles?.height);

            setPictureCount([
                Math.floor(worksheetWidth / pictureWidth),
                Math.floor(worksheetHeight / pictureHeight),
                Math.min(
                    isNaN(parseInt(picture.limit)) ? 1 : (parseInt(picture.limit) - 1),
                    Math.floor(worksheetWidth / pictureWidth) * Math.floor(worksheetHeight / pictureHeight) - 1
                )
            ]);
        }
    }, [worksheet, picture]);

    const getPictureSizeCm = () => {
        const r = pictureRef.current ? parseFloat(getComputedStyle(pictureRef.current).height) / parseFloat(getComputedStyle(pictureRef.current).width) : 1;
        const w = (worksheet.layout === 'portrait' ? worksheet.size[0] : worksheet.size[1]) * parseInt(picture.width) / 100;
        const h = (w * r).toFixed(2);
        return [w, h];
    }

    const setPictureSrc = (e: ChangeEvent<HTMLInputElement> | DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        setPicture(picture => ({...picture, dragging: e.type === 'dragover'}));

        if(e.type === 'change' || e.type === 'drop') {

            const file = e.type === 'change' ? 
                (e.currentTarget as HTMLInputElement).files?.item(0) :
                (e as DragEvent).dataTransfer.files?.item(0);

            const reader = new FileReader();

            if(file && reader) {
                reader.onloadend = (e: ProgressEvent<FileReader>) => setPicture(picture => ({...picture, src: e.target?.result?.toString()}));
                reader.readAsDataURL(file);
            }
        }
    }

    return (
        <>
            <div ref={worksheetRef} id="worksheet" className={
                'relative overflow-hidden max-w-full max-h-full outline-dashed -outline-offset-2 '+ 
                (picture.dragging ? 'bg-blue-50 outline-blue-500' : 
                    (picture.src ? 'bg-white outline-transparent' : 'bg-neutral-100 outline-neutral-300')
                )
            }
            style={{padding: `${worksheet.padding}cm`, aspectRatio}}
            onDragOver={setPictureSrc} onDragLeave={setPictureSrc} onDrop={setPictureSrc}>
                {picture.src ?
                <>
                    <img ref={pictureRef} src={picture.src} style={{width: `${picture.width}%`}} onLoad={forceRender} 
                        className="inline-block pointer-events-none" />
                    {[...Array(pictureCount[2])].map((_, i) => <Fragment key={`picture-${i}`}>

                        {worksheet.border && i < (pictureCount[0] - 1) && 
                            <div className="absolute inline-block top-0 border-l border-dashed border-neutral-400 h-full w-0"></div>}
                        
                        <img src={picture.src} style={{width: `${picture.width}%`}} className="inline-block pointer-events-none" />
                        
                        {worksheet.border && (1 + i) % pictureCount[0] === 0 && 
                            <div className="absolute inline-block left-0 border-t border-dashed border-neutral-400 w-full h-0"></div>}

                    </Fragment>)}
                </>:
                !picture.dragging &&
                <div className="w-full h-full flex flex-col items-center justify-center text-center">
                    <p className="text-neutral-400">
                        <Image className="w-20 h-20 stroke-1 mx-auto" />
                        Glissez votre image ici <br/>
                        ou<br />
                    </p>
                    <input type="file" id="picture-src" className="hidden" onChange={setPictureSrc} />
                    <label htmlFor="picture-src">Sélectionnez un fichier</label>
                </div>}
                {picture.dragging &&
                <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center text-center pointer-events-none">
                    <p className="p-8 rounded-xl bg-white/75 backdrop-blur-xl text-blue-600">
                        <ImageDown className="w-20 h-20 stroke-1 mx-auto" />
                        Lachez votre image !
                    </p>
                </div>}
            </div>
            <div className="absolute top-1/2 right-4 p-4 -translate-y-1/2 flex flex-col gap-4 rounded-xl shadow-2xl bg-white/75 backdrop-blur-xl print:hidden">
                <div>
                    <Switch.Group>
                        <Switch.Label className="title">Mise en page</Switch.Label>
                        <div className="flex gap-4">
                            <div className="flex gap-1">
                                <RectangleVertical className={`${worksheet.layout === 'portrait' ? 'text-blue-500 fill-blue-500' : 'text-neutral-500'}`} />
                            </div>
                            <Switch className="switch" checked={worksheet.layout === 'landscape'} 
                                onChange={checked => setWorksheet({...worksheet, layout: checked ? 'landscape' : 'portrait'})}>
                                <span className={`switch-toggle ${worksheet.layout === 'landscape' && 'switch-toggled'}`} />
                            </Switch>
                            <div className="flex gap-1">
                                <RectangleHorizontal className={`${worksheet.layout === 'landscape' ? 'text-blue-500 fill-blue-500' : 'text-neutral-500'}`} />
                            </div>
                        </div>
                    </Switch.Group>
                </div>
                <div>
                <Switch.Group>
                        <Switch.Label className="title">Afficher les bordures</Switch.Label>
                        <div className="flex gap-4">
                            <Switch className="switch" checked={worksheet.border} 
                                onChange={checked => setWorksheet({...worksheet, border: checked})}>
                                <span className={`switch-toggle ${worksheet.border && 'switch-toggled'}`} />
                            </Switch>
                        </div>
                    </Switch.Group>
                </div>
                <div>
                    <label htmlFor="worksheet-padding" className="title">Marges</label>
                    <div className="formfield">
                        <input type="number" id="worksheet-padding" value={worksheet.padding} min="0" max="10" step="0.1" className="with-suffix"
                            onChange={e => setWorksheet({...worksheet, padding: e.target.value})} />
                        <span className="suffix">cm</span>
                    </div>
                </div>
                <div>
                    <label htmlFor="picture-width" className="title">Taille de l'image</label>
                    <div className="formfield">
                        <input type="number" id="picture-width" value={picture.width} min="1" max="100" className="with-suffix"
                            onChange={e => setPicture({...picture, width: e.target.value})} />
                        <span className="suffix">%</span>
                    </div>
                    {pictureRef.current && <small className="text-neutral-500 ml-2">{getPictureSizeCm()[0]}cm x {getPictureSizeCm()[1]}cm</small>}
                </div>
                <div>
                    <label htmlFor="picture-limit" className="title">Nombre maximum d'images</label>
                    <div className="formfield">
                        <input type="number" id="picture-limit" value={picture.limit} min="1" max="250" 
                            onChange={e => setPicture({...picture, limit: e.target.value})} />
                    </div>
                </div>
                <div className="flex justify-end">
                    <button onClick={() => window.print()}><Printer /> Imprimer</button>
                </div>
            </div>
        </>
    )
}

export default App
