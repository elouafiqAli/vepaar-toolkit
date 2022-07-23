import moment from 'moment';
import axios from 'axios';
import { http_graphQL_helper } from './helpers.mjs';
import APISession from './api-session.mjs';
import InvoiceFile from './invoice-file.mjs';

// check if APISession has already been initialized

export default class Order{
    #obj = null;
    #checkOutForm = null;
    key = 0;
    invoiceFile = null;

    constructor(key = 0){
        this.key = key;
    }
    get orderId (){ 
        if(this.#obj != null && this.#obj != undefined)
            if(this.#obj.orderId != null && this.#obj.orderId  != undefined )
                return this.#obj.orderId; 
            else return null;
    }

    get isNull(){
        return (this.#obj == null || this.#obj == undefined);}

    static lastIdFilter = (order,lastId) => order.key > lastId;
    
    async get_invoiceInfo() {
        
        try{ 
            const response = await axios(Order.#order_invoice_http_request(this.key));
            if ((response != undefined) || (response.data != null) ){
                this.#obj = response.data.data.order;
                this.invoiceFile = new InvoiceFile(this.#obj.invoiceUrl);
            }
        }catch(e){
            console.log(e);
        }
      }
    
    static #order_invoice_http_request(id){
        return {
            method: 'post',
            url: APISession.api_config.API.baseurl,
            data: Order.#order_invoice_query(id),
            headers: APISession.auth_headers(),
          }
    }

    static #order_invoice_query = (id) => {
  
        const query = 'query($campaignId: Int!, $storeId: Int!, $id: Int!) {\n' +
        '  order(campaignId: $campaignId, storeId: $storeId, id: $id) {\n' +
        '    orderId\n' +
        '    orderStatus {\n' +
        '      id\n' +
        '      name\n' +
        '    }\n' +
        '    paymentStatus {\n' +
        '      id\n' +
        '      name\n' +
        '    }\n' +
        '    orderPaymentMode {\n' +
        '      id\n' +
        '      displayName\n' +
        '      providerTransactionId\n' +
        '    }\n' +
        '    adminNote\n' +
        '    total\n' +
        '    invoiceUrl\n' +
        '    receipt\n' +
        '  }\n' +
        '}\n';
        
        const variables = {
          id: id ,
          storeId : APISession.api_config.account.storeId ,
          campaignId: APISession.api_config.account.campaignId
        }
        return http_graphQL_helper(query,JSON.stringify(variables));
      
      }
      
      get vendor_name(){
          if(this.#checkOutForm !=null) 
            return this.#checkOutForm.address.landmark ;
          else 
            return '';
        }   

      get delivery_date() {
        return (this.#checkOutForm != null) ?
             moment(this.#checkOutForm.customerNote , 'DD/MM/YYYY HH:mm')
            : moment(0);
    }

      async get_checkOutForm(){
          console.log(Order.#checkout_http_request(this.key))
          let response = await axios(Order.#checkout_http_request(this.key));
          this.#checkOutForm = response.data.data.order.orderCheckoutForm;
          console.log('checkout ')
          exit()
      }
  
      static #checkout_http_request(id){
          return {
              method: 'post',
              url: APISession.api_config.API.baseurl,
              data: Order.#checkout_query(id),
              headers: APISession.auth_headers(),
            };
      }
  
      static #checkout_query(id){
          let query, variables;
  
          query = "query($campaignId: Int!, $storeId: Int!, $id: Int!) {"+
          "		  order(campaignId: $campaignId, storeId: $storeId, id: $id) {"+
          "			 customer {"+
          "				...__orderContact"+
          "			 }"+
          "			 placedAt"+
          "			 orderBy"+
          "			 adminNote"+
          "			 orderPaymentMode {"+
          "				displayName"+
          "				id"+
          "				providerTransactionId"+
          "			 }"+
          "			 shipping {"+
          "				name"+
          "			 }"+
          "			 shippingCharge"+
          "			 checkoutAddonCharge"+
          "			 additionalCharge"+
          "			 subTotal"+
          "			 adjustment"+
          "			 discountType"+
          "			 discountValue"+
          "			 discountAmount"+
          "			 appliedCoupon {"+
          "				code"+
          "				discountType"+
          "				discountValue"+
          "				discountedAmount"+
          "			 }"+
          "			 total"+
          "			 orderCheckoutForm {"+
          "				email"+
          "				customerNote"+
          "				address {"+
          "				    name"+
          "				    address"+
          "				    addressLine1"+
          "				    addressLine2"+
          "				    landmark"+
          "				    locality"+
          "				    city"+
          "				    state"+
          "				    country"+
          "				    pincode"+
          "				}"+
          "			 }"+
          "		  }"+
          "	   }"+
          "	   "+
          "	   "+
          "	   fragment __orderContact on Contact {"+
          "		  id"+
          "		  name"+
          "		  contactType"+
          "		  profilePicture {"+
          "			 url"+
          "		  }"+
          "		  mobileNumber {"+
          "			 internationalFormat"+
          "			 numberWithCallingCode"+
          "		  }"+
          "		  whatsapp {"+
          "			 name"+
          "		  }"+
          "	   } ";
    
          variables = {
              "id": id,
              "storeId": APISession.api_config.account.storeId,
              "campaignId": APISession.api_config.account.campaignId
          }
  
          return http_graphQL_helper(query,JSON.stringify(variables));
      }
}

