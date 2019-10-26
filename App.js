/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, {Component, Fragment} from 'react';
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  Button,
  View,
  Text,
  TextInput,
  StatusBar,
  Platform,
  PermissionsAndroid
} from 'react-native';
import { RNVoiceComparison, RNVoiceComparisonEmitter } from 'rn-voice-comparison';
import RNFS from 'react-native-fs';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';


import {
  Colors,
} from 'react-native/Libraries/NewAppScreen';

import { FFmpegUtils, Paths } from './ffmpeg'

const text = 'Grandpa what are you doing?'
const audio1 = Paths.origPath("testAudio")
const audio2 = Paths.userPath("testAudio")
const remoteAudio = 'https://voiceoverapi.digitalgalaxy.cn/files/video/video/Grandpa%2C%20what%20are%20you%20doing_.mp3'

class  App extends Component {
  constructor() {
    super();
    RNVoiceComparison.setup("bakhtiyor.k@gmail.com", "5e2a1bbe-3e91-46b3-ac3e-3cb066f945b6", "ReactNativeSampleApp");
      
    this.audioRecorderPlayer = new AudioRecorderPlayer();
    this.state = {
      result: "", 
      score: "", 
      wav1: "", 
      wav2: "", 
      text: "what are you doing"
    };
    this._onPressButton = this._onPressButton.bind(this);
    
    this.onVoiceComparisonError = this.onVoiceComparisonError.bind(this);
    this.onVoiceComparisonScore = this.onVoiceComparisonScore.bind(this);
    this.onVoiceComparisonResult = this.onVoiceComparisonResult.bind(this);

    RNVoiceComparisonEmitter.addListener('onVoiceComparisonError', this.onVoiceComparisonError);
    RNVoiceComparisonEmitter.addListener('onVoiceComparisonScore', this.onVoiceComparisonScore);
    RNVoiceComparisonEmitter.addListener('onVoiceComparisonResult', this.onVoiceComparisonResult);
  }

  onVoiceComparisonError = (event) => {
    Alert.alert("Error", event["error"]); 
  };

  onVoiceComparisonScore = (event) => {
    let id = event["id"];
    this.setState({score: event["score"]});  
  };

  onVoiceComparisonResult = (event) => {
    let id = event["id"];
    this.setState({result: event["result"], status: 'Finished comparing'});   
  };

 async _onPressButton() {
    this.setState({score: '', result: '', status: 'comparing'})
    const audios = await FFmpegUtils.converToWav("testAudio")
    console.log("wav audio paths", audios)


    alert(JSON.stringify(audios))

    // RNVoiceComparison.compare(Math.random(), this.state.wav1, this.state.wav2, this.state.text);
  }

  downloadFile = async () => { 
    if(this.state.downloading)  {
      return 
    }

    try {
      this.setState({audio1Available: false, status: 'downloading...', downloading: true})
      const params = {
        fromUrl: remoteAudio,
        toFile: audio1,
        connectionTimeout: 1000 * 10
      };
      await RNFS.downloadFile(params).promise
      this.setState({audio1Available: true, text, wav1: audio1, status: 'download success', downloading: false})
    } catch (e) {
      this.setState({audio1Available: false, status: `download error: ${e.message}`})
    }
  }
 
  startRecord = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Permissions for write access',
          message: 'Give permission to your storage to write a file',
          buttonPositive: 'ok',
        },
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {          
        console.log('You can use the storage');
      } else {
        this.setState({status: `storage permission ${granted}`})      
        return;
      }
    } catch (err) {
      console.warn(err);
      return;
    }
   
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Permissions for microphone access',
          message: 'Give permission to your microphone to record a file',
          buttonPositive: 'ok',
        },
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('You can use the microphone');
      } else {
        this.setState({status: `microphone permission ${granted}`})     
        return;
      }
    } catch (err) {
      console.warn(err);
      return;
    }
    
    if(this.audioRecorderPlayer._isRecording){
      this.stopRecord()
    }
    this.setState({status: 'recording...', recording: true })
    await this.audioRecorderPlayer.startRecorder(audio2);
    this.audioRecorderPlayer.addRecordBackListener(e => {      
      if (e.current_position >= 2 * 1000) {
        this.stopRecord();
         return;
      }    
    });        
  };

  stopRecord = async () => { 
    await this.audioRecorderPlayer.stopRecorder();
    this.audioRecorderPlayer.removeRecordBackListener();
    this.setState({ wav2: audio2, recording: false, audio2Available: true, status: 'recording finished' })   
  };

  play = async (path, player) => {
    this.setState({ status: 'playing...', [player]: true })
    await this.audioRecorderPlayer.startPlayer(path);
    this.audioRecorderPlayer.addPlayBackListener(e => {
      if (e.current_position === e.duration) {
        this.stopPlay(player);        
      }
    }); 
  };

  stopPlay = (player) => {    
    this.audioRecorderPlayer.stopPlayer();
    this.audioRecorderPlayer.removePlayBackListener(); 
    this.setState({ status: 'playing finished', [player]: false })
  };

  render() {
    const { audio1Available, audio2Available } = this.state
    return (
      <Fragment>
        <StatusBar barStyle="dark-content" />
        <SafeAreaView style={{flex: 1}}>
          <View style={styles.sectionTitle}>
            <Text style={styles.sectionTitleText}>
              VoiceComparison
            </Text>
          </View>
          <TextInput accessibilityHint="text"
            style={{height: 40, borderColor: 'gray', borderWidth: 1}}
            onChangeText={(wav1) => this.setState({wav1})}
            value={this.state.wav1} />
          <TextInput accessibilityHint="text"
            style={{height: 40, borderColor: 'gray', borderWidth: 1}}
            onChangeText={(wav2) => this.setState({wav2})}
            value={this.state.wav2} />  
          <TextInput accessibilityHint="text"
            style={{height: 40, borderColor: 'gray', borderWidth: 1}}
            onChangeText={(text) => this.setState({text})}
            value={this.state.text} />
        
          <View style={{flexDirection: 'row', marginBottom: 15}}>
            <Button 
              onPress={this.downloadFile} 
              title={this.state.downloading ? "Downloading..." : "Download Audio1"}
            />
            <Button             
              color="green"
              disabled={!audio1Available}
              onPress={() => this.play(this.state.wav1, 'player1')}
              title={this.state.player1 ? "Playing..." : "Play Audio1"}
            />
          </View>

          <View style={{flexDirection: 'row', marginBottom: 15}}>
            <Button
              onPress={this.startRecord}
              title={this.state.recording ? "Recording..." : "Record Audio2"}
            />
            <Button
              color="green"
              disabled={!audio2Available}
              onPress={() => this.play(this.state.wav2, 'player2')}
              title={this.state.player2 ? "Playing..." : "Play Audio2"}
            />
          </View>
  
          <Button
            onPress={this._onPressButton}
            title="Run"
          />
                    
          <Text>Status: {this.state.status}</Text>
          <Text>Score: {this.state.score}</Text>
          <ScrollView>
            <Text>Result: {this.state.result}</Text>        
          </ScrollView>
        </SafeAreaView>
      </Fragment>
    );
  };
};

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: Colors.lighter,
  },
  engine: {
    position: 'absolute',
    right: 0,
  },
  body: {
    backgroundColor: Colors.white,
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    backgroundColor: Colors.dark,
    padding: 10
  },
  sectionTitleText: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.white,
  },
});

export default App;
