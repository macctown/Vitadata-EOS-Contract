import { Api, JsonRpc, RpcError, JsSignatureProvider, SerialBuffer } from 'eosjs';
import fetch from 'node-fetch';
import { TextDecoder, TextEncoder } from 'text-encoding';

export const rpc = new JsonRpc('http://127.0.0.1:8888', { fetch });
export function initAPI(defaultPrivateKey){
    // const defaultPrivateKey = "5JtUScZK2XEp3g9gh7F8bwtPTRAkASmNrrftmx4AxDKD5K4zDnr";
    const signatureProvider = new JsSignatureProvider([defaultPrivateKey]);    
    const api = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() });
    return api;
}

export function name(name) {
    return name.split('').map(c=>c.charCodeAt(0)).reduce((r,x)=>{
        return (r<<8) + x;
    },0);
}

export function parse_token(token_string){
    const [amount, symbol] = token_string.split(' ');
    return Number(amount);
}