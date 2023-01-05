import fs from 'fs';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

/**
 * Get UTC date in a format `YYYY-MM-DD hh:mm:ss`
 * @returns The formatted date
 */
export const getPrettyDateTime = () =>
  new Date()
    .toISOString()
    .replace(/T/, ' ') // replace T with a space
    .replace(/\..+/, ''); // delete the dot and everything after

/**
 * Get Chain ID of the current network
 * @returns Chain ID of the network
 */
export const getChainId = async (hre: HardhatRuntimeEnvironment) =>
  hre.ethers.provider.getNetwork().then((network) => network.chainId);

/**
 * Remove empty string values from input array
 * @param arr Input array
 * @returns Cleaned array
 */
export const removeEmptyValues = (arr: string[]) => arr.filter((x) => !!x);

/**
 * Checks the existence of the folder and if it doesn't exist - creates it
 * @param folderName The name of the folder
 */
export const checkOrCreateFolder = (folderName: string) => {
  console.log(folderName);
  if (!fs.existsSync(folderName)) {
    // create a folder
    fs.mkdirSync(folderName, { recursive: true });
  }
};
