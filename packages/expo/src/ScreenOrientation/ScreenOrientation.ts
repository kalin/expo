import ExpoScreenOrientation from './ExpoScreenOrientation';
import { UnavailabilityError } from 'expo-errors';
import { EmitterSubscription, NativeEventEmitter, Platform } from 'react-native';

export enum Orientation {
  UNKNOWN = 'UNKNOWN',
  PORTRAIT = 'PORTRAIT',
  PORTRAIT_UP = 'PORTRAIT_UP',
  PORTRAIT_DOWN = 'PORTRAIT_DOWN',
  LANDSCAPE = 'LANDSCAPE',
  LANDSCAPE_LEFT = 'LANDSCAPE_LEFT',
  LANDSCAPE_RIGHT = 'LANDSCAPE_RIGHT',
}

export enum OrientationLock {
  DEFAULT = 'DEFAULT',
  ALL = 'ALL',
  PORTRAIT = 'PORTRAIT',
  PORTRAIT_UP = 'PORTRAIT_UP',
  PORTRAIT_DOWN = 'PORTRAIT_DOWN',
  LANDSCAPE = 'LANDSCAPE',
  LANDSCAPE_LEFT = 'LANDSCAPE_LEFT',
  LANDSCAPE_RIGHT = 'LANDSCAPE_RIGHT',
  OTHER = 'OTHER',
  ALL_BUT_UPSIDE_DOWN = 'ALL_BUT_UPSIDE_DOWN', // deprecated
}

enum SizeClassIOS {
  REGULAR = 'REGULAR',
  COMPACT = 'COMPACT',
  UNKNOWN = 'UNKNOWN',
}

type OrientationInfo = {
  orientation: Orientation;
  verticalSizeClass?: SizeClassIOS;
  horizontalSizeClass?: SizeClassIOS;
};

type PlatformOrientationInfo = {
  screenOrientationConstantAndroid?: number;
  screenOrientationArrayIOS?: Orientation[];
};

type OrientationChangeListener = (event: OrientationChangeEvent) => void;

type OrientationChangeEvent = {
  orientationLock: OrientationLock;
  orientationInfo: OrientationInfo;
};

const _orientationChangeEmitter = new NativeEventEmitter(ExpoScreenOrientation);
let _orientationChangeSubscribers: EmitterSubscription[] = [];

export function allow(orientationLock: OrientationLock): void {
  console.warn(
    "'ScreenOrientation.allow' is deprecated in favour of 'ScreenOrientation.lockAsync' and will be removed in SDK 35 or later"
  );
  lockAsync(orientationLock);
}

export async function allowAsync(orientationLock: OrientationLock): Promise<void> {
  console.warn(
    "'ScreenOrientation.allowAsync' is deprecated in favour of 'ScreenOrientation.lockAsync'"
  );
  await lockAsync(orientationLock);
}

export async function lockAsync(orientationLock: OrientationLock): Promise<void> {
  if (!ExpoScreenOrientation.lockAsync) {
    throw new UnavailabilityError('ScreenOrientation', 'lockAsync');
  }

  const orientationLocks = Object.values(OrientationLock);
  if (!orientationLocks.includes(orientationLock)) {
    throw new TypeError(`Invalid Orientation Lock: ${orientationLock}`);
  }

  if (orientationLock === OrientationLock.OTHER){
    return;
  }

  await ExpoScreenOrientation.lockAsync(orientationLock);
}

export async function lockPlatformAsync(options: PlatformOrientationInfo): Promise<void> {
  if (!ExpoScreenOrientation.lockPlatformAsync) {
    throw new UnavailabilityError('ScreenOrientation', 'lockPlatformAsync');
  }

  const { screenOrientationConstantAndroid, screenOrientationArrayIOS } = options;
  let platformOrientationParam;
  if (Platform.OS === 'android' && screenOrientationConstantAndroid) {
    if (isNaN(screenOrientationConstantAndroid)) {
      throw new TypeError(
        `lockPlatformAsync Android platform: screenOrientationConstantAndroid cannot be called with ${screenOrientationConstantAndroid}`
      );
    }
    platformOrientationParam = screenOrientationConstantAndroid;
  } else if (Platform.OS === 'ios' && screenOrientationArrayIOS) {
    if (!Array.isArray(screenOrientationArrayIOS)) {
      throw new TypeError(
        `lockPlatformAsync iOS platform: screenOrientationArrayIOS cannot be called with ${screenOrientationArrayIOS}`
      );
    }

    const orientations = Object.values(Orientation);
    for (let orientation of screenOrientationArrayIOS) {
      if (!orientations.includes(orientation)) {
        throw new TypeError(
          `lockPlatformAsync iOS platform: ${orientation} is not a valid Orientation`
        );
      }
    }
    platformOrientationParam = screenOrientationArrayIOS;
  }

  if (!platformOrientationParam){
    throw new TypeError('lockPlatformAsync cannot be called with undefined option properties');
  }
  await ExpoScreenOrientation.lockPlatformAsync(platformOrientationParam);
}

export async function unlockAsync(): Promise<void> {
  if (!ExpoScreenOrientation.unlockAsync) {
    throw new UnavailabilityError('ScreenOrientation', 'unlockAsync');
  }
  await ExpoScreenOrientation.unlockAsync();
}

export async function getOrientationAsync(): Promise<OrientationInfo> {
  if (!ExpoScreenOrientation.getOrientationAsync) {
    throw new UnavailabilityError('ScreenOrientation', 'getOrientationAsync');
  }
  return await ExpoScreenOrientation.getOrientationAsync();
}

export async function getOrientationLockAsync(): Promise<OrientationLock> {
  if (!ExpoScreenOrientation.getOrientationLockAsync) {
    throw new UnavailabilityError('ScreenOrientation', 'getOrientationLockAsync');
  }
  return await ExpoScreenOrientation.getOrientationLockAsync();
}

export async function getPlatformOrientationLockAsync(): Promise<PlatformOrientationInfo> {
  const platformOrientationLock = await ExpoScreenOrientation.getPlatformOrientationLockAsync();
  if (Platform.OS === 'android') {
    return {
      screenOrientationConstantAndroid: platformOrientationLock,
    };
  } else if (Platform.OS === 'ios') {
    return {
      screenOrientationArrayIOS: platformOrientationLock,
    };
  } else {
    throw new UnavailabilityError('ScreenOrientation', 'getPlatformOrientationLockAsync');
  }
}

export async function supportsOrientationLockAsync(
  orientationLock: OrientationLock
): Promise<boolean> {
  if (!ExpoScreenOrientation.supportsOrientationLockAsync) {
    throw new UnavailabilityError('ScreenOrientation', 'supportsOrientationLockAsync');
  }

  const orientationLocks = Object.values(OrientationLock);
  if (!orientationLocks.includes(orientationLock)) {
    throw new TypeError(`Invalid Orientation Lock: ${orientationLock}`);
  }

  return await ExpoScreenOrientation.supportsOrientationLockAsync(orientationLock);
}

export async function doesSupportAsync(orientationLock: OrientationLock): Promise<boolean> {
  console.warn(
    "'ScreenOrientation.doesSupportAsync' is deprecated in favour of 'ScreenOrientation.supportsOrientationLockAsync'"
  );
  return await supportsOrientationLockAsync(orientationLock);
}

// We rely on RN to emit `didUpdateDimensions`
// If this method no longer works, it's possible that the underlying RN implementation has changed
// see https://github.com/facebook/react-native/blob/c31f79fe478b882540d7fd31ee37b53ddbd60a17/ReactAndroid/src/main/java/com/facebook/react/modules/deviceinfo/DeviceInfoModule.java#L90
export function addOrientationChangeListener(
  listener: OrientationChangeListener
): EmitterSubscription {
  if (typeof listener !== 'function') {
    throw new TypeError(`addOrientationChangeListener cannot be called with ${listener}`);
  }

  const eventName = Platform.OS === 'ios' ? 'expoDidUpdateDimensions' : 'didUpdateDimensions';
  const subscription = _orientationChangeEmitter.addListener(eventName, async update => {
    let orientationInfo, orientationLock;
    if (Platform.OS === 'ios') {
      // RN relies on statusBarOrientation (deprecated) to emit `didUpdateDimensions` event, so we emit our own `expoDidUpdateDimensions` event instead
      orientationLock = update.orientationLock;
      orientationInfo = update.orientationInfo;
    } else {
      // We rely on the RN Dimensions to emit the `didUpdateDimensions` event on Android
      [orientationLock, orientationInfo] = await Promise.all([
        ExpoScreenOrientation.getOrientationLockAsync(),
        ExpoScreenOrientation.getOrientationAsync(),
      ]);
    }
    listener({ orientationInfo, orientationLock });
  });
  _orientationChangeSubscribers.push(subscription);

  return subscription;
}

export function removeOrientationChangeListeners(): void {
  // Remove listener by subscription instead of eventType to avoid clobbering Dimension module's subscription of didUpdateDimensions
  let i = _orientationChangeSubscribers.length;
  while (i--) {
    const subscriber = _orientationChangeSubscribers[i];
    subscriber.remove();

    // remove after a successful unsubscribe
    _orientationChangeSubscribers.pop();
  }
}

export function removeOrientationChangeListener(subscription: EmitterSubscription): void {
  if (!subscription || !subscription.remove) {
    throw new TypeError(`Must pass in a valid subscription`);
  }
  subscription.remove();
  _orientationChangeSubscribers = _orientationChangeSubscribers.filter(sub => sub !== subscription);
}
