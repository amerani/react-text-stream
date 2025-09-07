import React from 'react'
import * as ReactDOM from 'react-dom/client'
import { ReactEventStream, TextBox } from './dist/ReactEventStream'
import './dist/ReactEventStream.styles.css'

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(
    <> 
        <ReactEventStream />
        <TextBox />
    </>
)