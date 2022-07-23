import path from 'path';
import moment from 'moment';
import axios from "axios";
import fs from 'fs';
export const tic = () =>  { return {'timestamp':moment().format('DD-MM-YYYY HH:mm:ss')}};
export const http_graphQL_helper = (query, variables) =>   'query=' + encodeURIComponent(query) + '&variables=' + encodeURIComponent(variables)
export const pdf_format = '.pdf'
export const invoice_file_suffix = '?size=a4'
export const fileName = (download_folder,name) => path.join(download_folder,name + pdf_format);
// makes first letter go UpperCase
export const Firstcase = s => s.charAt(0).toUpperCase() + s.slice(1);
export const saveFileStream = async (fileUrl, filePath) => {
    try{
        const writer = fs.createWriteStream(filePath);
        let response = await axios({
            method: 'get',
            url: fileUrl,
            responseType: 'stream'
        });
        response.data.pipe(writer);
        return new Promise((resolve, reject) => {
            writer.on('finish', resolve)
            writer.on('error', reject)
        })
    }catch(e){
        console.log('some fine error',e)
    }

}
 