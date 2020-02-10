import { W3CBluetoothRemoteGATTDescriptor } from './interface/interfaces';
import { BluetoothRemoteGATTCharacteristic } from './characteristic';
import { adapter } from './adapter';

/**
 * Bluetooth Remote GATT Descriptor class
 */
export class BluetoothRemoteGATTDescriptor implements W3CBluetoothRemoteGATTDescriptor {

    /**
     * The characteristic the descriptor is related to
     */
    public readonly characteristic: BluetoothRemoteGATTCharacteristic = null;

    /**
     * The unique identifier of the descriptor
     */
    public readonly uuid: string = null;

    private _value: DataView = null;
    /**
     * The value of the descriptor
     */
    public get value(): DataView {
        return this._value;
    }

    private handle: string = null;

    /**
     * Descriptor constructor
     * @param init A partial class to initialise values
     */
    constructor(init: Partial<BluetoothRemoteGATTDescriptor>) {
        this.characteristic = init.characteristic;
        this.uuid = init.uuid;
        this._value = init.value;

        this.handle = `${this.characteristic.uuid}-${this.uuid}`;
    }

    /**
     * Gets the value of the descriptor
     * @returns Promise containing the value
     */
    public readValue(): Promise<DataView> {
        return new Promise((resolve, reject) =>  {
            if (!this.characteristic.service.device.gatt.connected) return reject("readValue error: device not connected");
            console.log("readValue");
            
            adapter.readDescriptor(this.handle, dataView => {
                this._value = dataView;
                resolve(dataView);
            }, error => {
                reject(`readValue error: ${error}`);
            });
        });
    }

    /**
     * Updates the value of the descriptor
     * @param value The value to write
     */
    public writeValue(value: ArrayBuffer | ArrayBufferView): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.characteristic.service.device.gatt.connected) return reject("writeValue error: device not connected");

            function isView(source: ArrayBuffer | ArrayBufferView): source is ArrayBufferView {
                return (source as ArrayBufferView).buffer !== undefined;
            }

            const arrayBuffer = isView(value) ? value.buffer : value;
            const dataView = new DataView(arrayBuffer);

            adapter.writeDescriptor(this.handle, dataView, () => {
                this._value = dataView;
                resolve();
            }, error => {
                reject(`writeValue error: ${error}`);
            });
        });
    }
}
