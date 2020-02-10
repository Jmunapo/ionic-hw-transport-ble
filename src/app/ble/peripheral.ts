import { BluetoothLE } from '@ionic-native/bluetooth-le/ngx';


export class NuPeripheral {
    // bluetoothLE: BluetoothLE = new BluetoothLE();
    id: string;
    uuid: string;
    address;
    name: string;
    addressType: any;
    connectable: any;
    advertisement: any = {};
    rssi: any;
    discovered: any;
    constructor(device: any,info, _discovered: any, uuids: any) {
        this.uuid = device.address;
        this.address = device.address;
        this.id = device.address;
        this.name = device.name;
        this.advertisement.localName = device.name;
        this.rssi = device.rssi;
        this.advertisement.serviceUuids = uuids;
        this.discovered = _discovered;
    }


}
