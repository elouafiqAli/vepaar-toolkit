import fs from 'fs';
import axios from 'axios';
import { http_graphQL_helper, pdf_format, fileName} from './helpers.mjs';
import APISession from './api-session.mjs';
const _STATUS_ = {processing: 'processing', success:'success'}
export default class ExportOrdersFetcher extends APISession {
    static get STATUS() {
        return _STATUS_
    }
    async init(){
        const probeStatus = await this.#export_probe()
        return probeStatus
    }

    async getLastExport(){
        let exportHistoryFile = Object()
        try {
            let _continue = true
            do {
                await new Promise(r => setTimeout(r, 1000))
                const {data: {data : {exportHistory : {data : _historyList }}}}
                    = await axios(ExportOrdersFetcher.export_history_http_request());
                exportHistoryFile = _historyList[0]
                if (exportHistoryFile.status == ExportOrdersFetcher.STATUS.success) break
                else if (exportHistoryFile.status  == ExportOrdersFetcher.STATUS.processing) continue
                else throw String('Some thing unheard of'+exportHistoryFile.status)
                console.log(exportHistoryFile)
            } while (exportHistoryFile.status == ExportOrdersFetcher.STATUS.processing)
        }
        catch(e){
            console.log(e)
        }
        console.log(exportHistoryFile)
        return exportHistoryFile
    }
    static export_history_http_request(id){
        return {
            method: 'post',
            url: APISession.api_config.API.baseurl,
            data: ExportOrdersFetcher.export_history_query(),
            headers: APISession.auth_headers(),
        }
    }
    static export_history_query(_page, _perPage){
        const perPage = _perPage || 25
        const page = _page || 1
        const campaignId = APISession.api_config.account.campaignId
        const module = "order"
        const variables = {perPage
                ,page
                ,campaignId
                ,module}
        const query =
            `query ($campaignId: Int!, $page: Int!, $perPage: Int, $module: String, $sort: Sort) {
                  exportHistory(
                    campaignId: $campaignId
                    page: $page
                    perPage: $perPage
                    sort: $sort
                    module: $module
                  ) {
                    pagination {
                      total
                      __typename
                    }
                    data {
                      status
                      url
                      module
                      fileName
                      createdAt
                      campaign {
                        id
                        __typename
                      }
                      __typename
                    }
                    __typename
                  }
                }`
        return http_graphQL_helper(query, JSON.stringify(variables))
    }
    async #export_probe(){
        try {
            let {data} = await axios(ExportOrdersFetcher.export_probe_http_request());
            return data
        }catch(e){
        }
    }
    static export_probe_http_request(id){
        return {
            method: 'post',
            url: APISession.api_config.API.baseurl,
            data: ExportOrdersFetcher.export_probe_query(),
            headers: APISession.auth_headers(),
        }
    }
    static export_probe_query(start_timestamp = 1658444400, end_timestamp = 1658530799) {
        const t_start = start_timestamp || 1658444400
        const t_end = end_timestamp || 1658530799
        let variables = {
            "campaignId": APISession.api_config.account.campaignId,
            "storeId":APISession.api_config.account.storeId,
            "filters":{"customerName":null,"mobileNo":null,"orderId":null,"categoryId":null,"productId":null,"orderStatusId":null,"paymentModeId":null,"paymentStatusId":null,"orderStartDate":null,"orderEndDate":null},
            "duration":{"start": t_start,"end":t_end,"preset":"custom","offset":-60}
        }

        let query = `
        query($campaignId: Int!, $storeId: Int!, $search: String, $filters: OrderFilter, $duration: Duration) {
          ordersExport(
            campaignId: $campaignId
            storeId: $storeId
            mimetype: "excel"
            search: $search
            filters: $filters
            duration: $duration
          )
        }`

        return http_graphQL_helper(query, JSON.stringify(variables));

    }

}