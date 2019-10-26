/* eslint-disable prettier/prettier */
import { RNFFmpeg } from 'react-native-ffmpeg';
import RNFS from 'react-native-fs';

const folderPath = Platform.select({
  ios: RNFS.TemporaryDirectoryPath,
  android: `${RNFS.CachesDirectoryPath}`
})

const extension = Platform.select({
  ios: 'm4a',
  android: 'mp4'
}) 

// RNFFmpeg.disableLogs()

export const Paths = {
  origPath: name => `${folderPath}/original-${name}.mp3`,
  origWavPath: name => `${folderPath}/original-${name}.wav`,
  userPath: name => `${folderPath}/user-${name}.${extension}`, 
  userWavPath: name => `${folderPath}/user-${name}.wav`,
}

const FFmpegScripts = {
  converMulti: async (name) => {
    return `-y -i ${Paths.origPath(name)} -i ${Paths.userPath(name)} -acodec pcm_s16le -ac 1 -ar 16000 -map 0 ${Paths.origWavPath(name)} -map 1 ${Paths.userWavPath(name)}`
  }
};

export const FFmpegUtils = {
  
  converToWav: async (uuid) => {
    RNFFmpeg.disableLogs()
    try {
      const audioConvertScript = await FFmpegScripts.converMulti(uuid)
      console.log('EXECUTING AUDIO TO WAV CONVERT SCRIPT:', audioConvertScript);
      const audioConvert = await RNFFmpeg.execute(audioConvertScript)
      console.log('AUDIO TO WAV CONVERT DONE:', audioConvert);
      return {
        orig: Paths.origWavPath(uuid),
        user: Paths.userWavPath(uuid)
      }
    } catch (e) {
      Promise.reject(e);
      console.log('FFmpegUtils converToWav errr', e);
    }
  },
 
  stopOperations: () => RNFFmpeg.cancel()
};
