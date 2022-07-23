import fs from 'fs';
import axios from 'axios';
import { http_graphQL_helper, pdf_format, fileName} from './helpers.mjs';
import APISession from './api-session.mjs';
import Order from './order.mjs';

export default class OrderQueueBuilder extends APISession{ 
    list = new Array();
    last_id = 0;
    static basedir = '';
    async processOrder(o){
        const order = new Order(o.id);
        const directory = OrderQueueBuilder.basedir;
        await order.get_invoiceInfo();
        console.log(order.orderId)
        const _filename = fileName(directory, order.orderId)
        //await order.get_checkOutForm();
        if(!fs.existsSync(_filename)){
            do{
                console.log('saving '+ order.orderId);
                await order.invoiceFile.save(_filename)
                if(fs.statSync(_filename).size == 0) console.log('rewriting ... ' + order.orderId +'.pdf')
            }while(fs.statSync(_filename).size == 0);
        }else{
            console.log('skipping '+  order.orderId);
        }
        return order;
    }
    async init(download_directory){
        OrderQueueBuilder.basedir = download_directory;
        const threshold = OrderQueueBuilder.api_config.params.threhold;
        await super.init();
        const buffer = await this.#getListOrders(threshold);
        console.log('... ' + buffer.length + ' orders');

        const param = 5;
        await this.parallelProcessOrder(buffer, 10)
        /*
        for(const o of buffer){
            const order = await this.#processOrder(o)
            this.list.push(order);
        }*/
    }
    
    parallelProcessOrder = async (buffer, buffer_window = 10)  => {
        console.log('got here');
        for(let o = 0; o < buffer.length ; o += buffer_window)
            await Promise.all(buffer.slice(o, o + buffer_window).map(order=> this.processOrder(order)))
    }

    async #getListOrders(){
        const threshold = OrderQueueBuilder.api_config.params.threshold;
        const page_count = OrderQueueBuilder.api_config.params.perPage ;
        console.log('skipping')
        const prompt_response = await axios(this.#list_of_orders_request(1 ,1));
        
        const total_orders = parseInt(prompt_response.data.data.orders.pagination.total);
        const total_pages = Math.ceil(total_orders/page_count);
        const max_pages = (threshold ==0) ? total_pages : Math.ceil(threshold/page_count);
        console.log([...Array(max_pages).keys()])
        
        const orders_by_page = await Promise.all([...Array(max_pages).keys()]
                .map(async page => await axios( this.#list_of_orders_request(page + 1,page_count))
                    .then( response => response.data.data.orders.data)));

        return [].concat(...orders_by_page).slice(0,threshold);
    }

    #list_of_orders_request(page = 1, page_count = OrderQueueBuilder.api_config.params.perPage ) {
        return {
            method: 'post',
            url: OrderQueueBuilder.api_config.API.baseurl,
            data: this.list_of_orders_query(page,page_count),
            headers: OrderQueueBuilder.auth_headers(),
        };
    }

    list_of_orders_query(page=1, page_count= OrderQueueBuilder.api_config.params.perPage ) {
        let variables = {
            "filters": {
            "customerName": null,
            "mobileNo": null,
            "orderId": null,
            "categoryId": null,
            "productId": null,
            "orderStatusId": null,
            "paymentModeId": null,
            "paymentStatusId": null,
            "orderStartDate": null,
            "orderEndDate": null
            },
            "perPage": page_count,
            "page": page,
            "campaignId": OrderQueueBuilder.api_config.account.campaignId,
            "storeId": OrderQueueBuilder.api_config.account.storeId
        }

        let query = 'query ($campaignId: Int!, $storeId: Int!, $page: Int!, $perPage: Int, $search: String, $filters: OrderFilter) {\n'+
            '  orders(\n'+
            '    campaignId: $campaignId\n'+
            '    storeId: $storeId\n'+
            '    page: $page\n'+
            '    perPage: $perPage\n'+
            '    search: $search\n'+
            '    filters: $filters\n'+
            '  ) {\n'+
            '    pagination {\n'+
            '      total\n'+
            '      __typename\n'+
            '    }\n'+
            '    data {\n'+
            '      id\n'+
            '      orderId\n'+
            '      orderBy\n'+
            '      placedAt\n'+
            '      orderStatus {\n'+
            '        id\n'+
            '        name\n'+
            '        __typename\n'+
            '      }\n'+
            '      paymentStatus {\n'+
            '        id\n'+
            '        name\n'+
            '        __typename\n'+
            '      }\n'+
            '      customer {\n'+
            '        id\n'+
            '        name\n'+
            '        contactType\n'+
            '        profilePicture {\n'+
            '          url\n'+
            '          __typename\n'+
            '        }\n'+
            '        mobileNumber {\n'+
            '          internationalFormat\n'+
            '          numberWithCallingCode\n'+
            '          __typename\n'+
            '        }\n'+
            '        whatsapp {\n'+
            '          name\n'+
            '          __typename\n'+
            '        }\n'+
            '        __typename\n'+
            '      }\n'+
            '      orderPaymentMode {\n'+
            '        id\n'+
            '        displayName\n'+
            '        __typename\n'+
            '      }\n'+
            '      shipping {\n'+
            '        name\n'+
            '        __typename\n'+
            '      }\n'+
            '      total\n'+
            '      __typename\n'+
            '    }\n'+
            '    __typename\n'+
            '  }\n}';

            return http_graphQL_helper(query,JSON.stringify(variables));
        
    } 
}