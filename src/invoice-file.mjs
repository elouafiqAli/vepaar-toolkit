import fs from 'fs';
import axios from 'axios';
import { invoice_file_suffix } from './helpers.mjs';


export default class InvoiceFile{
    invoiceUrl = '';
    constructor(invoiceUrl){  this.invoiceUrl = invoiceUrl+invoice_file_suffix; }
    async save(file_name){
        try{
            const writer = fs.createWriteStream(file_name);
            let response = await axios(this.#invoice_file_http_request());
            response.data.pipe(writer);
            return new Promise((resolve, reject) => {
                writer.on('finish', resolve)
                writer.on('error', reject)
              })            
        }catch(e){
        }
        
    }
    async #get_file(){
        const response = await axios(this.#invoice_file_http_request());
        return response.data;
    }
    
    #invoice_file_http_request(){
        return {
            method: 'get',
            url: this.invoiceUrl,
            responseType: 'stream'
          }
    }
    static lastIdFilter
    
}