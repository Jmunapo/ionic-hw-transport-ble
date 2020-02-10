
// import { Bluetooth } from "./bluetooth";
// import { BluetoothRemoteGATTServer } from "./server";
// import { BluetoothRemoteGATTServiceEvents } from "./service";

import { EventDispatcher, TypedDispatcher } from './dispatcher';
import { W3CBluetoothDevice } from './interface/interfaces';
import { BluetoothDeviceEvents } from './interface/bluetooth.interface';
import { BluetoothRemoteGATTServer } from './server';
import { Bluetooth } from './bluetooth';

/**
 * Bluetooth Device class
 */
export class BluetoothDevice
  extends (EventDispatcher as new () => TypedDispatcher<BluetoothDeviceEvents>)
  implements W3CBluetoothDevice {
  /**
   * The unique identifier of the device
   */
  public readonly id: string = null;

  /**
   * The name of the device
   */
  public readonly name: string = null;

  /**
   * The gatt server of the device
   */
  public readonly gatt: BluetoothRemoteGATTServer = null;

  /**
   * Whether adverts are being watched (not implemented)
   */
  public readonly watchingAdvertisements: boolean = false;

  /**
   * @hidden
   */
  public readonly adData: {
    rssi?: number;
    txPower?: number;
    serviceData?: Map<string, DataView>;
    manufacturerData?: Map<string, DataView>;
  };

  /**
   * @hidden
   */
  public readonly _bluetooth: Bluetooth = null;

  /**
   * @hidden
   */
  public readonly _allowedServices: Array<string> = [];

  /**
   * @hidden
   */
  public readonly _serviceUUIDs: Array<string> = [];

  private _oncharacteristicvaluechanged: (ev: Event) => void;
  public set oncharacteristicvaluechanged(fn: (ev: Event) => void) {
    if (this._oncharacteristicvaluechanged) {
      this.removeEventListener(
        "characteristicvaluechanged",
        this._oncharacteristicvaluechanged
      );
    }
    this._oncharacteristicvaluechanged = fn;
    this.addEventListener(
      "characteristicvaluechanged",
      this._oncharacteristicvaluechanged
    );
  }

  private _onserviceadded: (ev: Event) => void;
  public set onserviceadded(fn: (ev: Event) => void) {
    if (this._onserviceadded) {
      this.removeEventListener("serviceadded", this._onserviceadded);
    }
    this._onserviceadded = fn;
    this.addEventListener("serviceadded", this._onserviceadded);
  }

  private _onservicechanged: (ev: Event) => void;
  public set onservicechanged(fn: (ev: Event) => void) {
    if (this._onservicechanged) {
      this.removeEventListener("servicechanged", this._onservicechanged);
    }
    this._onservicechanged = fn;
    this.addEventListener("servicechanged", this._onservicechanged);
  }

  private _onserviceremoved: (ev: Event) => void;
  public set onserviceremoved(fn: (ev: Event) => void) {
    if (this._onserviceremoved) {
      this.removeEventListener("serviceremoved", this._onserviceremoved);
    }
    this._onserviceremoved = fn;
    this.addEventListener("serviceremoved", this._onserviceremoved);
  }

  private _ongattserverdisconnected: (ev: Event) => void;
  public set ongattserverdisconnected(fn: (ev: Event) => void) {
    if (this._ongattserverdisconnected) {
      this.removeEventListener(
        "gattserverdisconnected",
        this._ongattserverdisconnected
      );
    }
    this._ongattserverdisconnected = fn;
    this.addEventListener(
      "gattserverdisconnected",
      this._ongattserverdisconnected
    );
  }

  private _onadvertisementreceived: (ev: Event) => void;
  public set onadvertisementreceived(fn: (ev: Event) => void) {
    if (this._onadvertisementreceived) {
      this.removeEventListener(
        "advertisementreceived",
        this._onadvertisementreceived
      );
    }
    this._onadvertisementreceived = fn;
    this.addEventListener(
      "advertisementreceived",
      this._onadvertisementreceived
    );
  }

  /**
   * Device constructor
   * @param init A partial class to initialise values
   */
  constructor(init: Partial<BluetoothDevice>) {
    super();

    this.id = init.id;
    this.name = init.name;
    this.gatt = init.gatt;
    this.watchAdvertisements = init.watchAdvertisements;
    this.adData = init.adData;

    this._bluetooth = init._bluetooth;
    this._allowedServices = init._allowedServices;
    this._serviceUUIDs = init._serviceUUIDs;

    if (!this.name) this.name = `Unknown or Unsupported Device (${this.id})`;
    if (!this.gatt) this.gatt = new BluetoothRemoteGATTServer(this);
  }

  /**
   * Starts watching adverts from this device (not implemented)
   */
  public watchAdvertisements(): Promise<void> {
    return new Promise((_resolve, reject) => {
      reject("watchAdvertisements error: method not implemented");
    });
  }

  /**
   * Stops watching adverts from this device (not implemented)
   */
  public unwatchAdvertisements() {
    return new Promise((_resolve, reject) => {
      reject("unwatchAdvertisements error: method not implemented");
    });
  }
}
