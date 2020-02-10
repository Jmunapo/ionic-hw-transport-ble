import { EventDispatcher, TypedDispatcher } from './dispatcher';
import { W3CBluetoothRemoteGATTCharacteristic } from './interface/interfaces';
import { BluetoothRemoteGATTCharacteristicEvents } from './interface/bluetooth.interface';
import { BluetoothRemoteGATTService } from './service';
import { BluetoothRemoteGATTDescriptor } from './descriptor';
import { DOMEvent } from './events';
import { getDescriptorUUID } from './helpers';
import { adapter } from './adapter';

/**
 * Bluetooth Remote GATT Characteristic class
 */
export class BluetoothRemoteGATTCharacteristic extends (EventDispatcher as new() => TypedDispatcher<BluetoothRemoteGATTCharacteristicEvents>) implements W3CBluetoothRemoteGATTCharacteristic {

    /**
     * The service the characteristic is related to
     */
    public readonly service: BluetoothRemoteGATTService = null;

    /**
     * The unique identifier of the characteristic
     */
    public readonly uuid = null;

    /**
     * The properties of the characteristic
     */
    public readonly properties: any;//BluetoothCharacteristicProperties - (NOT FOUND);

    private _value: DataView = null;
    /**
     * The value of the characteristic
     */
    public get value(): DataView {
        return this._value;
    }

    private handle: string = null;
    private descriptors: Array<BluetoothRemoteGATTDescriptor> = null;

    private _oncharacteristicvaluechanged: (ev: Event) => void;
    public set oncharacteristicvaluechanged(fn: (ev: Event) => void) {
        if (this._oncharacteristicvaluechanged) {
            this.removeEventListener("characteristicvaluechanged", this._oncharacteristicvaluechanged);
        }
        this._oncharacteristicvaluechanged = fn;
        this.addEventListener("characteristicvaluechanged", this._oncharacteristicvaluechanged);
    }

    /**
     * Characteristic constructor
     * @param init A partial class to initialise values
     */
    constructor(init: Partial<BluetoothRemoteGATTCharacteristic>) {
        super();

        this.service = init.service;
        this.uuid = init.uuid;
        this.properties = init.properties;
        this._value = init.value;

        this.handle = this.uuid;
    }

    private setValue(value?: DataView, emit?: boolean) {
        this._value = value;
        if (emit) {
            this.dispatchEvent(new DOMEvent(this, "characteristicvaluechanged"));
            this.service.dispatchEvent(new DOMEvent(this, "characteristicvaluechanged"));
            this.service.device.dispatchEvent(new DOMEvent(this, "characteristicvaluechanged"));
            this.service.device._bluetooth.dispatchEvent(new DOMEvent(this, "characteristicvaluechanged"));
        }
    }

    /**
     * Gets a single characteristic descriptor
     * @param descriptor descriptor UUID
     * @returns Promise containing the descriptor
     */
    public getDescriptor(descriptor: string | number): Promise<BluetoothRemoteGATTDescriptor> {
        return new Promise((resolve, reject) => {
            if (!this.service.device.gatt.connected) return reject("getDescriptor error: device not connected");
            if (!descriptor) return reject("getDescriptor error: no descriptor specified");

            this.getDescriptors(descriptor)
            .then(descriptors => {
                if (descriptors.length !== 1) return reject("getDescriptor error: descriptor not found");
                resolve(descriptors[0]);
            })
            .catch(error =>  {
                reject(`getDescriptor error: ${error}`);
            });
        });
    }

    /**
     * Gets a list of the characteristic's descriptors
     * @param descriptor descriptor UUID
     * @returns Promise containing an array of descriptors
     */
    public getDescriptors(descriptor?: string | number): Promise<Array<BluetoothRemoteGATTDescriptor>> {
        return new Promise((resolve, reject) => {
            if (!this.service.device.gatt.connected) return reject("getDescriptors error: device not connected");

            function complete() {
                if (!descriptor) return resolve(this.descriptors);

                const filtered = this.descriptors.filter(descriptorObject => {
                    return (descriptorObject.uuid === getDescriptorUUID(descriptor));
                });

                if (filtered.length !== 1) return reject("getDescriptors error: descriptor not found");
                resolve(filtered);
            }

            if (this.descriptors) return complete.call(this);

            adapter.discoverDescriptors(this.handle, [], descriptors => {
                this.descriptors = descriptors.map(descriptorInfo => {
                    Object.assign(descriptorInfo, {
                        characteristic: this
                    });
                    return new BluetoothRemoteGATTDescriptor(descriptorInfo);
                });

                complete.call(this);
            }, error => {
                reject(`getDescriptors error: ${error}`);
            });
        });
    }

    /**
     * Gets the value of the characteristic
     * @returns Promise containing the value
     */
    public readValue(): Promise<DataView> {
        return new Promise((resolve, reject) => {
            if (!this.service.device.gatt.connected) return reject("readValue error: device not connected");

            adapter.readCharacteristic(this.handle, dataView => {
                this.setValue(dataView, true);
                resolve(dataView);
            }, error => {
                reject(`readValue error: ${error}`);
            });
        });
    }

    /**
     * Updates the value of the characteristic
     * @param value The value to write
     */
    public writeValue(value: ArrayBuffer | ArrayBufferView): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.service.device.gatt.connected) return reject("writeValue error: device not connected");

            function isView(source: ArrayBuffer | ArrayBufferView): source is ArrayBufferView {
                return (source as ArrayBufferView).buffer !== undefined;
            }

            const arrayBuffer = isView(value) ? value.buffer : value;
            const dataView = new DataView(arrayBuffer);

            adapter.writeCharacteristic(this.handle, dataView, () => {
                this.setValue(dataView);
                console.log(dataView);
                
                resolve();
            }, error => {
                console.log(error);
                reject(`writeValue error: ${error}`);
            });
        });
    }

    /**
     * Start notifications of changes for the characteristic
     * @returns Promise containing the characteristic
     */
    public startNotifications(): Promise<W3CBluetoothRemoteGATTCharacteristic> {
        return new Promise((resolve, reject) => {
            if (!this.service.device.gatt.connected) return reject("startNotifications error: device not connected");
            adapter.enableNotify(this.handle, dataView => {
                this.setValue(dataView, true);
            }, () => {
                resolve(this);
            }, error => {
                reject(`startNotifications error: ${error}`);
            });
        });
    }

    /**
     * Stop notifications of changes for the characteristic
     * @returns Promise containing the characteristic
     */
    public stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic> {
        return new Promise((resolve, reject) => {
            if (!this.service.device.gatt.connected) return reject("stopNotifications error: device not connected");

            adapter.disableNotify(this.handle, () => {
                resolve(this);
            }, error => {
                reject(`stopNotifications error: ${error}`);
            });
        });
    }
}
