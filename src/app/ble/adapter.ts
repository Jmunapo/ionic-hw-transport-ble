// import { platform } from "os";
// import * as noble from "@abandonware/noble";
import { EventEmitter } from 'events';
import { BluetoothDevice } from './device';
import { BluetoothRemoteGATTService } from './service';
import { BluetoothRemoteGATTCharacteristic } from './characteristic';
import { BluetoothRemoteGATTDescriptor } from './descriptor';
import { getCanonicalUUID } from './helpers';
import { Peripheral } from './interface/peripheral';
import { BluetoothLE } from '@ionic-native/bluetooth-le/ngx';
import { timer } from 'rxjs';

import { getInfosForServiceUuid } from "@ledgerhq/devices";
import { NuPeripheral } from './peripheral';

/**
 * @hidden
 */
export interface Adapter extends EventEmitter {
    getEnabled: (completeFn: (enabled: boolean) => void) => void;
    startScan: (filters, serviceUUIDs: Array<string>, foundFn: (device: Partial<BluetoothDevice>) => void, completeFn?: () => void, errorFn?: (errorMsg: string) => void) => void;
    stopScan: (errorFn?: (errorMsg: string) => void) => void;
    connect: (handle: string, connectFn: () => void, disconnectFn: () => void, errorFn?: (errorMsg: string) => void) => void;
    disconnect: (handle: string, errorFn?: (errorMsg: string) => void) => void;
    discoverServices: (handle: string, serviceUUIDs: Array<string>, completeFn: (services: Array<Partial<BluetoothRemoteGATTService>>) => void, errorFn?: (errorMsg: string) => void) => void;
    discoverIncludedServices: (handle: string, serviceUUIDs: Array<string>, completeFn: (services: Array<Partial<BluetoothRemoteGATTService>>) => void, errorFn?: (errorMsg: string) => void) => void;
    discoverCharacteristics: (handle: string, characteristicUUIDs: Array<string>, completeFn: (characteristics: Array<Partial<BluetoothRemoteGATTCharacteristic>>) => void, errorFn?: (errorMsg: string) => void) => void;
    discoverDescriptors: (handle: string, descriptorUUIDs: Array<string>, completeFn: (descriptors: Array<Partial<BluetoothRemoteGATTDescriptor>>) => void, errorFn?: (errorMsg: string) => void) => void;
    readCharacteristic: (handle: string, completeFn: (value: DataView) => void, errorFn?: (errorMsg: string) => void) => void;
    writeCharacteristic: (handle: string, value: DataView, completeFn?: () => void, errorFn?: (errorMsg: string) => void) => void;
    enableNotify: (handle: string, notifyFn: () => void, completeFn?: () => void, errorFn?: (errorMsg: string) => void) => void;
    disableNotify: (handle: string, completeFn?: () => void, errorFn?: (errorMsg: string) => void) => void;
    readDescriptor: (handle: string, completeFn: (value: DataView) => void, errorFn?: (errorMsg: string) => void) => void;
    writeDescriptor: (handle: string, value: DataView, completeFn?: () => void, errorFn?: (errorMsg: string) => void) => void;
}

/**
 * @hidden
 */
export class NobleAdapter extends EventEmitter implements Adapter {

    public static EVENT_ENABLED: string = "enabledchanged";

    private deviceHandles: {} = {};
    private serviceHandles: {} = {};
    private characteristicHandles: {} = {};
    private descriptorHandles: {} = {};
    private charNotifies: {} = {};
    private discoverFn: (device: Peripheral) => void = null; //changed :noble.Peripheral
    private initialised: boolean = false;
    private enabled: boolean = false;
    // private os: string = platform();

    private poweredOn: boolean = false;

    private bluetoothLE: BluetoothLE = new BluetoothLE();

    // private noble: any = {};

    private bleInit;

    constructor() {
        super();
        this.enabled = this.state;
        this.checkEnable();
        console.log("Ionic Bluetooth");
    }

    private initialise(bluetoothLE: BluetoothLE): Promise<any> {
        return new Promise(function (resolve, reject) {
            bluetoothLE.initialize().subscribe(res => {
                resolve(res);
            }, err => reject(err))
        });
    }

    private async checkEnable(times: number = 0) {
        console.log(times);
        try {
            try {
                await this.bluetoothLE.enable();
            } catch (error) {
                console.log(error);
                return;
            }
            let init;
            try {
                init = await this.initialise(this.bluetoothLE);
                this.bleInit = init;
            } catch (error) {
                console.log(error);
                throw new Error('Bluetooth is not initialised');
            }
            if (!init || init.status !== 'enabled')
                throw new Error('Bluetooth is not enabled');
            let enabled = await this.bluetoothLE.isEnabled();
            if (!enabled.isEnabled) throw new Error('Bluetooth is not available');
            const permission = await this.bluetoothLE.hasPermission();
            if (!permission.hasPermission) {
                const allowed = await this.bluetoothLE.requestPermission();
                if (!allowed.requestPermission) throw new Error('Permission was denied');
            }
            this.poweredOn = true;
            this.enabled = true;
            this.emit(NobleAdapter.EVENT_ENABLED, this.enabled);
        } catch (error) {
            console.log(error, times);
            timer(1000).subscribe(() => {
                times++;
                if (times < 7) {
                    this.checkEnable(times);
                }
            })
        }
    }

    private get state(): boolean {
        return this.poweredOn;
    }

    private checkForError(errorFn, continueFn?, delay?: number) {
        return function (error) {
            if (error) errorFn(error);
            else if (typeof continueFn === "function") {
                const args = [].slice.call(arguments, 1);
                if (delay === null) continueFn.apply(this, args);
                else setTimeout(() => continueFn.apply(this, args), delay);
            }
        };
    }

    private bufferToDataView(buffer: Buffer): DataView {
        // Buffer to ArrayBuffer
        const arrayBuffer = new Uint8Array(buffer).buffer;
        return new DataView(arrayBuffer);
    }

    private dataViewToBuffer(dataView: DataView): Buffer {
        // DataView to TypedArray
        const typedArray = new Uint8Array(dataView.buffer);
        return new Buffer(typedArray);
    }



    private deviceToBluetoothDevice(deviceInfo): Partial<BluetoothDevice> {
        const deviceID = (deviceInfo.address && deviceInfo.address !== "unknown") ? deviceInfo.address : deviceInfo.id;

        const serviceUUIDs = [];
        if (deviceInfo.advertisement.serviceUuids) {
            deviceInfo.advertisement.serviceUuids.forEach(serviceUUID => {
                serviceUUIDs.push(getCanonicalUUID(serviceUUID));
            });
        }

        const manufacturerData = new Map();
        if (deviceInfo.advertisement.manufacturerData) {
            // First 2 bytes are 16-bit company identifier
            const company = deviceInfo.advertisement.manufacturerData.readUInt16LE(0);

            // Remove company ID
            const buffer = deviceInfo.advertisement.manufacturerData.slice(2);
            manufacturerData.set(("0000" + company.toString(16)).slice(-4), this.bufferToDataView(buffer));
        }

        const serviceData = new Map();
        if (deviceInfo.advertisement.serviceData) {
            deviceInfo.advertisement.serviceData.forEach(serviceAdvert => {
                serviceData.set(getCanonicalUUID(serviceAdvert.uuid), this.bufferToDataView(serviceAdvert.data));
            });
        }

        return {
            id: deviceID,
            name: deviceInfo.advertisement.localName,
            _serviceUUIDs: serviceUUIDs,
            adData: {
                rssi: deviceInfo.rssi,
                txPower: deviceInfo.advertisement.txPowerLevel,
                serviceData: serviceData,
                manufacturerData: manufacturerData
            }
        };
    }

    public getEnabled(completeFn: (enabled: boolean) => void) {
        console.log("Crazy");
        
        throw "Something crazy";
        function stateCB() {
            completeFn(this.state);
        }

        // if (this.noble.state === "unknown" || this.noble.state === "poweredOff") {
        //     // tslint:disable-next-line:no-string-literal
        //     this.noble["once"]("stateChange", stateCB.bind(this));
        // } else {
        //     stateCB.call(this);
        // }
    }

    private bond(bluetoothLE: BluetoothLE, address: any): Promise<any> {
        return new Promise(function (resolve, reject) {
            bluetoothLE.bond({ address }).subscribe((res: any) => {
                if (res.status === "bonded" || res.status === "unbonded") {
                    resolve(res)
                }
            }, err => {
                console.log(err);
                reject(err);
            })
        });
    }


    public startScan(filters, serviceUUIDs: Array<string>, foundFn: (device: Partial<BluetoothDevice>) => void, completeFn?: () => void, errorFn?: (errorMsg: string) => void): void {
        this.discoverFn = async deviceInfo => {

            this.bluetoothLE.close({ address: deviceInfo.address })
                .then(closed => {
                    console.log(closed);
                    return true;
                })
                .catch(error => {
                    console.log(error);
                    if (error.error === "neverConnected") {
                        return true;
                    }
                })
                .finally(() => {
                    this.bluetoothLE
                        .connect({ address: deviceInfo.address, autoConnect: false }).subscribe(async connected => {
                            if (connected.status !== "connected") throw "Not connected";
                            let bond: any = await this.bluetoothLE.isBonded({ address: deviceInfo.address });
                            if (!bond.isBonded) {
                                bond = await this.bond(this.bluetoothLE, deviceInfo.address);
                                if (!bond || bond.status !== "bonded") throw new Error('Bonding error');
                            }
                            let discovered;

                            try {
                                discovered = await this.bluetoothLE.discover({ address: deviceInfo.address });
                            } catch (error) {
                                console.log(error);
                                return
                            }

                            if (discovered.status === "discovered") {

                                let peripheral;

                                discovered.services.forEach(s => {
                                    const dInfo = getInfosForServiceUuid(s.uuid);
                                    if (dInfo) {
                                        peripheral = dInfo;
                                    }
                                });

                                const info = new NuPeripheral(
                                    deviceInfo, peripheral, discovered, serviceUUIDs
                                )

                                const device = this.deviceToBluetoothDevice(info);
                                if (!this.deviceHandles[device.id]) {
                                    this.deviceHandles[device.id] = new BluetoothDevice(info);
                                    this.deviceHandles[device.id]['discovered'] = discovered;
                                    // Only call the found function the first time we find a valid device
                                    foundFn(device);
                                }
                            }
                        })
                })
        };

        async function _scan(discoverFn: any, that) {
            let bleTimer;


            console.log(that.bleInit);
            
            const scanning = that.bluetoothLE.isScanning();
            if ((await scanning).isScanning) await that.bluetoothLE.stopScan();
            that.bluetoothLE.startScan(
                {
                    ...filters,
                    "allowDuplicates": false,
                    "scanMode": that.bluetoothLE.SCAN_MODE_LOW_LATENCY,
                    "matchMode": that.bluetoothLE.MATCH_MODE_AGGRESSIVE,
                    "matchNum": that.bluetoothLE.MATCH_NUM_MAX_ADVERTISEMENT,
                    "callbackType": that.bluetoothLE.CALLBACK_TYPE_ALL_MATCHES
                }
            ).subscribe(res => {
                console.log(res);
                
                if ('address' in res && discoverFn) discoverFn(res);
                if (!bleTimer) {
                    bleTimer = timer(3000).subscribe(async () => {
                        await that.bluetoothLE.stopScan();
                        console.log("Scanning completed ⎄");
                    })
                }
            }, err => {
                console.log(err);
                errorFn("Error scanning")
            })
        }
        _scan(this.discoverFn, this);

    }

    public stopScan(_errorFn?: (errorMsg: string) => void): void {
        this.discoverFn = null;
        this.bluetoothLE.stopScan();
    }

    public connect(handle: string, connectFn: () => void, disconnectFn: () => void, errorFn?: (errorMsg: string) => void): void {
        const baseDevice = this.deviceHandles[handle];
        baseDevice.removeAllListeners("connect");
        baseDevice.removeAllListeners("disconnect");
        // baseDevice.once("connect", connectFn);
        baseDevice.once("disconnect", () => {
            this.serviceHandles = {};
            this.characteristicHandles = {};
            this.descriptorHandles = {};
            this.charNotifies = {};
            disconnectFn();
        });

        connectFn();
        // baseDevice.connect(this.checkForError(errorFn));
    }

    public disconnect(handle: string, errorFn?: (errorMsg: string) => void): void {
        
        console.log("Crazy");
        
        throw "Something crazy";
        const baseDevice = this.deviceHandles[handle];
        baseDevice.disconnect(this.checkForError(errorFn));
    }

    public discoverServices(handle: string, serviceUUIDs: Array<string>, completeFn: (services: Array<Partial<BluetoothRemoteGATTService>>) => void, errorFn?: (errorMsg: string) => void): void {
        const discovered = this.deviceHandles[handle].discovered;
        const services = [];

        if (discovered && discovered.services) {
            discovered.services.forEach(service => {
                if (!isNaN(Number(service.uuid))) return;
                if (!this.serviceHandles[service.uuid]) this.serviceHandles[service.uuid] = service;

                services.push({
                    uuid: service.uuid,
                    primary: true
                });
            });
        }
        completeFn(services);
    }

    public discoverIncludedServices(handle: string, serviceUUIDs: Array<string>, completeFn: (services: Array<Partial<BluetoothRemoteGATTService>>) => void, errorFn?: (errorMsg: string) => void): void {
        console.log("Crazy");
        
        throw "Something crazy";

        const serviceInfo = this.serviceHandles[handle];
        serviceInfo.discoverIncludedServices([], this.checkForError(errorFn, services => {
            throw "Funny discoverIncludedServices";
            const discovered = [];
            services.forEach(service => {
                const serviceUUID = getCanonicalUUID(service.uuid);

                if (serviceUUIDs.length === 0 || serviceUUIDs.indexOf(serviceUUID) >= 0) {
                    console.log(this.serviceHandles);

                    if (!this.serviceHandles[serviceUUID]) this.serviceHandles[serviceUUID] = service;

                    discovered.push({
                        uuid: serviceUUID,
                        primary: false
                    });
                }
            }, this);

            completeFn(discovered);
        }));
    }

    public discoverCharacteristics(handle: string, characteristicUUIDs: Array<string>, completeFn: (characteristics: Array<Partial<BluetoothRemoteGATTCharacteristic>>) => void, errorFn?: (errorMsg: string) => void): void {
        const serviceInfo = this.serviceHandles[handle];
        const discovered = [];
        serviceInfo.characteristics.forEach(char => {
            this.characteristicHandles[char.uuid] = char;
            discovered.push({
                uuid: char.uuid,
                ...char.properties
            });
        });
        completeFn(discovered);
    }

    public discoverDescriptors(handle: string, descriptorUUIDs: Array<string>, completeFn: (descriptors: Array<Partial<BluetoothRemoteGATTDescriptor>>) => void, errorFn?: (errorMsg: string) => void): void {
        console.log("Descriptors");
        console.log("Crazy");
        
        throw "Something crazy";
        const characteristicInfo = this.characteristicHandles[handle];
        characteristicInfo.discoverDescriptors(this.checkForError(errorFn, descriptors => {

            const discovered = [];
            descriptors.forEach(descriptorInfo => {
                const descUUID = getCanonicalUUID(descriptorInfo.uuid);

                if (descriptorUUIDs.length === 0 || descriptorUUIDs.indexOf(descUUID) >= 0) {
                    const descHandle = characteristicInfo.uuid + "-" + descriptorInfo.uuid;
                    if (!this.descriptorHandles[descHandle]) this.descriptorHandles[descHandle] = descriptorInfo;

                    discovered.push({
                        uuid: descUUID
                    });
                }
            }, this);

            completeFn(discovered);
        }));
    }

    public readCharacteristic(handle: string, completeFn: (value: DataView) => void, errorFn?: (errorMsg: string) => void): void {
        console.log("Crazy");
        throw "Funny readCharacteristic";

        this.characteristicHandles[handle].read(this.checkForError(errorFn, data => {
            const dataView = this.bufferToDataView(data);
            completeFn(dataView);
        }));
    }

    public writeCharacteristic(handle: string, value: DataView, completeFn?: () => void, errorFn?: (errorMsg: string) => void): void {

        const buffer = this.dataViewToBuffer(value);
        const characteristic = this.characteristicHandles[handle];
        const address = Object.keys(this.deviceHandles)[0];
        const service = Object.keys(this.serviceHandles)[0];


        this.bluetoothLE.write({
            address,
            characteristic: characteristic.uuid,
            service,
            value: this.bluetoothLE.bytesToEncodedString(buffer)
        }).then(res => {
            console.log(res);
        }).catch(err => {
            console.error(err);
            errorFn("Error write")
        })
    }

    public enableNotify(handle: string, notifyFn: (value: DataView) => void, completeFn?: () => void, errorFn?: (errorMsg: string) => void): void {
        const characteristic = this.characteristicHandles[handle];
        const address = Object.keys(this.deviceHandles)[0];
        const service = Object.keys(this.serviceHandles)[0];

        console.log("Enabling notification");
        

        this.bluetoothLE.subscribe({
            address,
            characteristic: characteristic.uuid,
            service
        }).subscribe(res => {
            if (res.status !== "subscribed") return errorFn("notify failed to enable");
            this.charNotifies[handle] = notifyFn;
            completeFn();
        }, err => {
                if (err.message !== "Already subscribed") {
                    console.log(err);
                    return errorFn("notify failed to enable")
                }
        });
        // this.characteristicHandles[handle].notify(true, this.checkForError(errorFn));
    }

    public disableNotify(handle: string, completeFn?: () => void, errorFn?: (errorMsg: string) => void): void {
        console.log("Crazy");
        
        throw "Something crazy";
        
        if (!this.charNotifies[handle]) {
            return completeFn();
        }
        this.characteristicHandles[handle].once("notify", state => {
            if (state !== false) return errorFn("notify failed to disable");
            if (this.charNotifies[handle]) delete this.charNotifies[handle];
            completeFn();
        });
        this.characteristicHandles[handle].notify(false, this.checkForError(errorFn));
    }

    public readDescriptor(handle: string, completeFn: (value: DataView) => void, errorFn?: (errorMsg: string) => void): void {
        console.log("Crazy");
        
        throw "Something crazy";
        this.descriptorHandles[handle].readValue(this.checkForError(errorFn, data => {
            const dataView = this.bufferToDataView(data);
            completeFn(dataView);
        }));
    }

    public writeDescriptor(handle: string, value: DataView, completeFn?: () => void, errorFn?: (errorMsg: string) => void): void {
        console.log("Crazy");
        
        throw "Something crazy";
        const buffer = this.dataViewToBuffer(value);
        this.descriptorHandles[handle].writeValue(buffer, this.checkForError(errorFn, completeFn));
    }
}

/**
 * @hidden
 */
export const adapter = new NobleAdapter();
