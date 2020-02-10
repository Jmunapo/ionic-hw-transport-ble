export interface Peripheral {
    id?: string;
    uuid?: string;
    noble?: any;
    address;
    addressType?: any;
    connectable?: any;
    advertisement?:any;
    rssi?:any;
}