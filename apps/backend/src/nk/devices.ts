import axios from "axios";

// URL base for all devices requests
const DEVICES_URL_BASE = "https://logbook-api.nksports.com/api/v1";

/**
 * Response type of getting a singular device by its ID
 */
interface IDevicesByIdResponse {
  id: number; // ID of the device. NOTE: There can be multiple devices with different IDs for a given serial number
  type: 1 | 2 | 3 | 4 | 5 | 6 | 7; // 1 for speed coach, 2 for cox box, 3 for oarlock, 4, for impeller, 5 for heart-rate belt, 6 for seat display, 7 for boat light
  model: string; // Human-readable description of what the device is
  name: string; // Human-readable device name
  firmwareVersion: string; // Firmware version running on the device
  hardwareVersion: string; // Hardware version running on the device
  serialNumber: number; // Serial number of the device (should this be the same as ID? Yes. Is it? No)
  manufacturerName: string; // String representation of the manufacturer of the device
  profileVersion: string; // BLE profile version running on the device
  inboardLength: number | null; // If the device is an EmPower OarLock, this is the saved inboard reading
  oarLength: number | null; // If the device is an EmPower OarLock, this is the saved oar length
  portStarboard: 0 | 1 | null; // If the device is an EmPower OarLock, this will be 0 for port, 1 for starboard
  seatNumber: number | null; // If the device is an EmPower OarLock, this will be the saved seat number
  slaveDevices: IDevicesByIdResponse[]; // Devices that are controlled by this device
}

/**
 * Response type of getting all devices associated with the account
 */
type IDevicesResponse = IDevicesByIdResponse[];

/**
 * Function to get all devices associated with the given account
 * @param accessToken the access token to use to access the data
 * @returns the devices associated with the account
 */
export async function getAllDevices(
  accessToken: string,
): Promise<IDevicesResponse> {
  return (
    await axios.get<IDevicesResponse>("/devices", {
      baseURL: DEVICES_URL_BASE,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
  ).data;
}

/**
 * Function to get a singular device by the device ID
 * @param accessToken the access token to use to access the data
 * @param deviceId the devices associated with the account
 * @returns the singular device associated with the account
 */
export async function getDevice(
  accessToken: string,
  deviceId: number,
): Promise<IDevicesByIdResponse> {
  return (
    await axios.get<IDevicesByIdResponse>(`/devices/${deviceId}`, {
      baseURL: DEVICES_URL_BASE,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
  ).data;
}
