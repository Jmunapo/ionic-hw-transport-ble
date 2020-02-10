# FIX ME [This is not working]
## ionic-hw-transport-ble
Ionic 4 @ledgerhq/hw-transport with ionic native bluetoothLE

### Intro
Hi, thank you for your interest. I'm trying to make a bluetooth transport
for stellar ledger to communicate with my [Ledger Nano X](https://shop.ledger.com/pages/ledger-nano-x) using bluetooth to sign transaction and programmatically view my assets using [ionic 4](https://ionicframework.com/)

### Tried
Clone this repo and run `$ npm install`
Assuming you have your platform setup for developing ionic applications with cordova run

`$ ionic cordova platform add android`
This will setup your application for building to android

In your file system's project folder, navigate to the file
`node_modules/@ledgerhq/hw-transport-web-ble/lib-es/TransportWebBLE.js`
*I know, you should never do this, just for testing*

<b>Change</b>
```

const requiresBluetooth = () => {
  // $FlowFixMe
  const {
    bluetooth
  } = navigator;

  if (typeof bluetooth === "undefined") {
    throw new Error("web bluetooth not supported");
  }

  return bluetooth;
};

```

<b>To</b>

```
const requiresBluetooth = () => {
  // $FlowFixMe
  const { ionic_ble } = navigator;

  if (typeof ionic_ble === "undefined") {
    throw new Error("web bluetooth not supported");
  }

  return ionic_ble;
};

```

to match `src/app/app.component.ts`

Run `$ ionic cordova build android --device -l`
This will run application in your device, <b>Note</b> Make sure it's connected with a data cable and debug mode is enabled

### Plan

Since the library [@ledgerhq/hw-transport-web-ble](https://github.com/LedgerHQ/ledgerjs/tree/master/packages/hw-transport-web-ble) uses `navigator.bluetooth` 
and [node-web-bluetooth](https://github.com/IjzerenHein/node-web-bluetooth) provides 
the same APIs, I thought I could build the same

So I wrote the same implementation checkout [src/app/ble](https://github.com/Jmunapo/ionic-hw-transport-ble/blob/master/src/app/ble/index.ts)

### Problem
In the file `node_modules/@ledgerhq/hw-transport-web-ble/lib-es/TransportWebBLE.js`

I can't figure out how this method works and what I'm missing.
```

  async inferMTU() {
    let mtu = 23;
    await this.exchangeAtomicImpl(async () => {
      try {
        mtu =
          (await merge(
            this.notifyObservable.pipe(
              first(buffer => buffer.readUInt8(0) === 0x08),
              map(buffer => buffer.readUInt8(5))
            ),
            defer(() => from(this.write(Buffer.from([0x08, 0, 0, 0, 0])))).pipe(
              ignoreElements()
            )
          ).toPromise()) + 3;
      } catch (e) {
        log("ble-error", "inferMTU got " + String(e));
        this.device.gatt.disconnect();
        throw e;
      }
    });

    if (mtu > 23) {
      const mtuSize = mtu - 3;
      log(
        "ble-verbose",
        `BleTransport(${String(this.id)}) mtu set to ${String(mtuSize)}`
      );
      this.mtuSize = mtuSize;
    }

    return this.mtuSize;
  }

  ```

  If someone can help that would be really great for my organisation and the community

  ***Thank you***

