import { BluetoothDevice } from '../device';

export interface BluetoothOptions {
     /**
   * A `device found` callback function to allow the user to select a device
   */
  deviceFound?: (device: BluetoothDevice, selectFn: () => void) => boolean;

  /**
   * The amount of seconds to scan for the device (default is 10)
   */
  scanTime?: number;

  /**
   * An optional referring device
   */
  referringDevice?: BluetoothDevice;
}


export interface BluetoothRemoteGATTCharacteristicEvents {
    /**
     * Characteristic value changed event
     */
    characteristicvaluechanged: Event;
}


export interface BluetoothRemoteGATTServiceEvents
    extends BluetoothRemoteGATTCharacteristicEvents {
    /**
     * Service added event
     */
    serviceadded: Event;
    /**
     * Service changed event
     */
    servicechanged: Event;
    /**
     * Service removed event
     */
    serviceremoved: Event;
}

export interface BluetoothDeviceEvents
    extends BluetoothRemoteGATTServiceEvents {
    /**
     * GATT server disconnected event
     */
    gattserverdisconnected: Event;
    /**
     * Advertisement received event
     */
    advertisementreceived: Event;
}

/**
 * @hidden
 */
export interface BluetoothEvents extends BluetoothDeviceEvents {
    /**
     * Bluetooth Availability Changed event
     */
    availabilitychanged: Event;
  }
  

