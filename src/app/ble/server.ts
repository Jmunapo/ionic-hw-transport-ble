import { W3CBluetoothRemoteGATTServer } from './interface/interfaces';
import { BluetoothDevice } from './device';
import { BluetoothRemoteGATTService } from './service';
import { adapter } from './adapter';
import { DOMEvent } from './events';
import { getServiceUUID } from '.';

/**
 * Bluetooth Remote GATT Server class
 */
export class BluetoothRemoteGATTServer implements W3CBluetoothRemoteGATTServer   {
  /**
   * The device the gatt server is related to
   */
  public readonly device: BluetoothDevice    = null;

  private _connected: boolean = false;
  /**
   * Whether the gatt server is connected
   */
  public get connected(): boolean {
    return this._connected;
  }

  private handle: string = null;
  private services: Array<BluetoothRemoteGATTService> = null;

  /**
   * Server constructor
   * @param device Device the gatt server relates to
   */
  constructor(device: BluetoothDevice) {
    this.device = device;
    this.handle = this.device.id;
  }

  /**
   * Connect the gatt server
   * @returns Promise containing the gatt server
   */
  public connect(): Promise<BluetoothRemoteGATTServer> {
    return new Promise((resolve, reject) => {
      if (this.connected)
        return reject("connect error: device already connected");
      console.log("Server connect");
      
      adapter.connect(
        this.handle,
        () => {
          this._connected = true;
          resolve(this);
        },
        () => {
          this.services = null;
          this._connected = false;
          this.device.dispatchEvent(
            new DOMEvent(this.device, "gattserverdisconnected")
          );
          this.device._bluetooth.dispatchEvent(
            new DOMEvent(this.device, "gattserverdisconnected")
          );
        },
        error => {
          reject(`connect Error: ${error}`);
        }
      );
    });
  }

  /**
   * Disconnect the gatt server
   */
  public disconnect() {
    adapter.disconnect(this.handle);
    this._connected = false;
  }

  /**
   * Gets a single primary service contained in the gatt server
   * @param service service UUID
   * @returns Promise containing the service
   */
  public getPrimaryService(
    service: string | number
  ): Promise<BluetoothRemoteGATTService> {
    return new Promise((resolve, reject) => {
      if (!this.connected)
        return reject("getPrimaryService error: device not connected");
      if (!service)
        return reject("getPrimaryService error: no service specified");

      this.getPrimaryServices(service)
        .then(services => {
          if (services.length !== 1)
            return reject("getPrimaryService error: service not found");
          resolve(services[0]);
        })
        .catch(error => {
          reject(`getPrimaryService error: ${error}`);
        });
    });
  }

  /**
   * Gets a list of primary services contained in the gatt server
   * @param service service UUID
   * @returns Promise containing an array of services
   */
  public getPrimaryServices(
    service?: string | number
  ): Promise<Array<BluetoothRemoteGATTService>> {
    return new Promise((resolve, reject) => {
      if (!this.connected)
        return reject("getPrimaryServices error: device not connected");

      function complete() {
        if (!service) return resolve(this.services);

        const filtered = this.services.filter(serviceObject => {
          return serviceObject.uuid === getServiceUUID(service);
        });

        if (filtered.length !== 1)
          return reject("getPrimaryServices error: service not found");
        resolve(filtered);
      }

      if (this.services) return complete.call(this);

      adapter.discoverServices(
        this.handle,
        this.device._allowedServices,
        services => {
          this.services = services.map(serviceInfo => {
            Object.assign(serviceInfo, {
              device: this.device
            });
            return new BluetoothRemoteGATTService(serviceInfo);
          });

          complete.call(this);
        },
        error => {
          reject(`getPrimaryServices error: ${error}`);
        }
      );
    });
  }
}
