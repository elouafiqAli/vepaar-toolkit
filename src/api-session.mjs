import axios from 'axios';

export default class APISession{   
    static auth_token = 'none'; 
    static api_config;
    static token;
    
    static auth_headers = () => { 
        return { Authorization: ("Bearer "+APISession.auth_token) } };

    async init(api_config = APISession.api_config){

        if(APISession.auth_token == 'none' && api_config != undefined){
            APISession.api_config = api_config
            const email = APISession.api_config.account.email
            const password = APISession.api_config.account.password
            const response = await axios(this.#authentication_http_request(email,password))
            APISession.auth_token =  response.data.data.login.token
        } 
    }

    async http_request(request){
        let response = await axios(request);
        return response;
    }

    #authentication_http_request(email,password){
        return {
            url: APISession.api_config.API.auth,
            method: 'post',
            data: this.#auth_graphQL_query(email,password) 
        }
    }
    
    static http_graphQL_helper(query, variables) {
        return 'query=' + encodeURIComponent(query) +
               '&variables=' + encodeURIComponent(variables)
    }
    
    #auth_graphQL_query = (email_,password_) => {
      
        const query ='mutation($input: LoginInput!) {\n' +
        '  login(input: $input) {\n' +
        '    user {\n' +
        '      id\n' +
        '      campaigns {\n' +
        '        id\n' +
        '      }\n' +
        '    }\n' +
        '    token\n' +
        '  }\n' +
        '}\n';
    
        const variables = {input : { email : email_, password :password_ }};
        return APISession.http_graphQL_helper(query,JSON.stringify(variables));
    }
}
