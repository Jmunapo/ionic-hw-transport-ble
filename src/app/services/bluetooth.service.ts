import { Injectable } from "@angular/core";

import {
  getBluetoothServiceUuids,
  getInfosForServiceUuid
} from "@ledgerhq/devices";

@Injectable({
  providedIn: "root"
})
export class BluetoothService {
  constructor() {}
}

export const deviceParams = () => {
  return getBluetoothServiceUuids();
};
