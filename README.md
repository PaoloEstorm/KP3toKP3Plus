# KP3toKP3+

This is a guide to make a patched firmware for the **Korg Kaoss Pad 3**, to be installed via Korg's official updater. The patched firmware brings all the features of the **Kaoss Pad 3+** to the Kaoss Pad 3, with no compromises.

## Added features

- Improved audio effects
- 22 brand-new effects (including high-quality compressors and reverbs)
- Improved MIDI in/out handling
- SD card support up to 32 GB (versus the KP3's 1 GB maximum)
- Other minor improvements

## How it works

This guide is the result of extensive hardware and software reverse engineering of both devices. The analysis showed that the substantial hardware differences between the KP3 and the KP3+ are:

1. A redesigned power system that runs at 9 V instead of 12 V, with digital power on/off.
2. Some minor changes to the LED management system.

So, I made a tool [KP3toKP3+](https://claude.ai/public/artifacts/252b6445-3526-4f42-8b56-d16654cf0c4b) that targets the parts of the KP3+ firmware that depend on the KP3+ specific hardware and adapts them via software to the KP3 hardware, making the two devices compatible at the firmware level.

## Required materials

1. A **Korg Kaoss Pad 3** unit connected via USB to a Windows machine (or VM)
2. **KAOSS PAD KP3 V2.0 System Updater** (Windows) — [download](https://www.korg.com/us/support/download/software/1/118/1400/)
3. **KAOSS PAD KP3+ V1.04 System Updater** (Windows) — [download](https://www.korg.com/us/support/download/software/0/124/3090/)
4. The [KP3toKP3+](https://claude.ai/public/artifacts/252b6445-3526-4f42-8b56-d16654cf0c4b) tool.
   
## Usage guide

1. Extract the contents of `KP3_Updater_0200E2.zip` (KP3 V2.0 System Updater) and `KP3PlusUpdater_0104.zip` (KAOSS PAD KP3+ V1.04 System Updater) into any folder on your PC.
2. Open [KP3toKP3+](https://claude.ai/public/artifacts/252b6445-3526-4f42-8b56-d16654cf0c4b).
3. In **Section 1 (KP3 Firmware V2.0)**, press **Select** and choose the file `KP3.VSB`, located in `KP3_Updater_0200E2/System/KP3_0200_Updater/Updater`.
4. In **Section 2 (KP3+ Firmware V1.04)**, press **Select** and choose the file `KP3Plus.VSB`, located in `KP3PlusUpdater_0104/Updater`.
5. Press the **Combine** button, then download the patched firmware by clicking **download** in **Section 3 (Combined image)**.
6. Connect the KP3, powered off, via USB and boot it in **IPL mode**: turn on the KP3 while holding **SAMPLE BANK [C]**, **[D]**, and **[SAMPLING]**. The KP3 display will show `IPL`.
7. Launch `KP3_updater.exe` from `KP3_Updater_0200E2/System/KP3_0200_Updater/Updater`, then click **File → Open** and select the `KP3_to_KP3plus.vsb` (file generated and downloaded from the tool in step 5).
8. Press **Setting → Force Update** and click **OK** in the warning popup.
9. If everything is set up correctly, pressing **Update** should start the flashing procedure on the device. **Do NOT disconnect or move the device during the update.** Wait until the process is finished, when a popup confirms the update completed successfully.
   If the updater does not detect any device, close the updater, disconnect the KP3, and install the drivers in `KP3_Updater_0200E2/System/KP3_0200_Updater/Driver` by right-clicking `KORGBK64.INF` and selecting **Install**. Once the driver is installed, connect the KP3 in IPL mode and follow the procedure again from step 7.
10. After flashing the ROM, you MUST reset the EEPROM for correct operation. To do it, power off the KP3, hold **[1] + [2] + [SAMPLING]** and turn on the device. The display will show a blinking `PrLd`. Release the buttons and proceed by pressing **[SAMPLE BANK D]**. Wait 10 seconds while the display shows `Wrt`, and at the end of the process it will show `PoFF`. Turn the device off and on again, and enjoy your new KP3+!

**Note:** If the procedure completed successfully, your device has effectively become a KP3+. So, if you plan to use the Editor application or use it as a MIDI-USB controller, you'll need the Drivers and the KP3+ Editor, both downloadable form the [official support page](https://www.korg.com/us/support/download/product/0/124/).
