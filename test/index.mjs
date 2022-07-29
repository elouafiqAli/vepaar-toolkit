import path from 'path';
import fs from 'fs';
import {fileURLToPath} from 'url';
import {APISession, ExportOrdersFetcher, Helpers } from "../src/index.mjs";
const {saveFileStream} = Helpers


const extXLSX = '.xlsx'
const VEPAAR_CONFIG_PATH = './veepar-config.json'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const VEPAAR_CONFIG = JSON.parse(fs.readFileSync(
    path.join(__dirname,VEPAAR_CONFIG_PATH), 'utf8'))

async function global_session_init(config){
    const setupSession = new APISession()
    await setupSession.init(config)
    console.log(APISession.api_config)
}
async function download_export_orders(fileName){
    const targetFile = path.join(__dirname,fileName)
    const exportBatch = new ExportOrdersFetcher()
    await exportBatch.init()
    const lastExport = await exportBatch.getLastExport()
    await saveFileStream(lastExport.url, targetFile)
}

async function main(){
    const fileName = 'default'
    await global_session_init(VEPAAR_CONFIG)
    await download_export_orders(fileName.concat(extXLSX))
}

main()
