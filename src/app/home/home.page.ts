import { Component, OnInit } from '@angular/core';
import { ImagePicker } from '@ionic-native/image-picker/ngx';
import { ActionSheetController, Platform, ToastController } from '@ionic/angular';
import { MediaCapture, MediaFile, CaptureError } from '@ionic-native/media-capture/ngx';
import { File, FileEntry } from '@ionic-native/File/ngx';
import { Media, MediaObject } from '@ionic-native/media/ngx';
import { StreamingMedia } from '@ionic-native/streaming-media/ngx';
import { PhotoViewer } from '@ionic-native/photo-viewer/ngx';
import { AlertController } from '@ionic/angular';

const MEDIA_FOLDER_NAME = 'my_media';
var mediaName = '';
var mediaFolder = '';
var mediaCalidad=0;
var mediaDuracion=0;

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss']
})

export class HomePage implements OnInit {
  files = [];
 
  constructor(
    private imagePicker: ImagePicker,
    private mediaCapture: MediaCapture,
    private file: File,
    private media: Media,
    private streamingMedia: StreamingMedia,
    private photoViewer: PhotoViewer,
    private actionSheetController: ActionSheetController,
    private plt: Platform,
    private alertController: AlertController
  ) {}
 
  ngOnInit() {
    this.plt.ready().then(() => {
      let path = 'file:///storage/emulated/0/';
      this.file.checkDir(path, MEDIA_FOLDER_NAME).then(
        () => {
          this.loadFiles();
        },
        err => {
          this.file.createDir(path, MEDIA_FOLDER_NAME, false);
        }
      );
    });
  }
 
  loadFiles() {
    this.file.listDir('file:///storage/emulated/0/',MEDIA_FOLDER_NAME).then(
      res => {
        this.files = res;
      },
      err => console.log('error loading files: ', err)
    );
  }

  async selectMedia() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Selecciona:',
      buttons: [
        {
          text: 'Tomar una Foto',
          handler: () => {

            this.captureImage();
          }
        },
        {
          text: 'Grabar un Video',
          handler: () => {
            
            this.recordVideo();
          }
        },
        {
          text: 'Grabar Audio',
          handler: () => {
            this.recordAudio();
          }
        },
        {
          text: 'Selecciona Foto',
          handler: () => {
            this.pickImages();
          }
        },
        {
          text: 'Cancelar',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }
 
  pickImages() {
    this.imagePicker.getPictures({}).then(
      results => {
        for (var i = 0; i < results.length; i++) {
          this.copyFileToLocalDir(results[i]);
        }
      }
    );
  }
 
  captureImage() {
    this.mediaCapture.captureImage().then(
      (data: MediaFile[]) => {
        if (data.length > 0) {
          this.copyFileToLocalDir(data[0].fullPath);
        }
      },
      (err: CaptureError) => console.error(err)
    );
  }
 
  recordAudio() {
    this.mediaCapture.captureAudio().then(
      (data: MediaFile[]) => {
        if (data.length > 0) {
          this.copyFileToLocalDir(data[0].fullPath);
        }
      },
      (err: CaptureError) => console.error(err)
    );
  }
 
  async recordVideo() {
    await this.opcionesVideo();
    if(mediaCalidad>1)
      mediaCalidad=1;
    if(mediaCalidad<0)
      mediaCalidad=0
    if(mediaDuracion!=0){
      this.mediaCapture.captureVideo({limit:1,quality:mediaCalidad,duration:mediaDuracion}).then(
        (data: MediaFile[]) => {
          if (data.length > 0) {
            this.copyFileToLocalDir(data[0].fullPath);
          }
        },
        (err: CaptureError) => console.error(err)
      );
    }else{
      this.mediaCapture.captureVideo({limit:1,quality:mediaCalidad}).then(
        (data: MediaFile[]) => {
          if (data.length > 0) {
            this.copyFileToLocalDir(data[0].fullPath);
          }
        },
        (err: CaptureError) => console.error(err)
      );
    }
  }

  async copyFileToLocalDir(fullPath) {
    
    let myPath = fullPath;
    mediaName='';
    mediaFolder='';
    console.log(myPath);
    if (fullPath.indexOf('file://') < 0) {
      myPath = 'file://' + fullPath;
      console.log(myPath);
    }
 
    const ext = myPath.split('.').pop();
    const d = Date.now();
     
    const name = myPath.substr(myPath.lastIndexOf('/') + 1);
    var newn=name.replace(/%20/g,' ');
    const copyFrom = myPath.substr(0, myPath.lastIndexOf('/') + 1);

    const copyTo = this.file.dataDirectory + MEDIA_FOLDER_NAME;
    var finalName='';
    var finalFolder='';
    await this.presentAlertPrompt();
    if(mediaName=='')
      finalName = `${d}.${ext}`;
    else
      finalName=`${mediaName}.${ext}`;

    if(mediaFolder=='')
      finalFolder = MEDIA_FOLDER_NAME;
    else
      finalFolder=mediaFolder;

    this.file.copyFile(copyFrom, newn, 'file:///storage/emulated/0/' + finalFolder, finalName).then(
      success => {
        this.loadFiles();
      },
      error => {
        console.log('error: ', error);
      }
    );
  }
 
  openFile(f: FileEntry) {
    if (f.name.indexOf('.mp3') > -1) {
      this.streamingMedia.playAudio(f.nativeURL);
    } else if (f.name.indexOf('.MOV') > -1 || f.name.indexOf('.mp4') > -1 ) {
      this.streamingMedia.playVideo(f.nativeURL);
    } else if (f.name.indexOf('.jpg') > -1) {
      this.photoViewer.show(f.nativeURL, f.name);
    }
  }
 
  deleteFile(f: FileEntry) {
    const path = f.nativeURL.substr(0, f.nativeURL.lastIndexOf('/') + 1);
    this.file.removeFile(path, f.name).then(() => {
      this.loadFiles();
    }, err => console.log('error remove: ', err));
  }

  async presentAlertPrompt() {
    const alert = await this.alertController.create({
      header: 'Nombre',
      inputs: [
        {
          name: 'Nombre',
          type: 'text',
          placeholder: 'Nombre'
        },
        {
          name: 'Carpeta',
          type: 'text',
          placeholder: 'Carpeta'
        }
      ],
      buttons: [{ text: 'Aceptar',
          handler: () => {
            console.log('Confirm Ok');
          }
        }
      ]
    });

    await alert.present();
    let result = await alert.onDidDismiss();
    console.log(result.data.values.Nombre);
    mediaName=result.data.values.Nombre;
    mediaFolder=result.data.values.Carpeta;
    let path = 'file:///storage/emulated/0/';
    if(mediaFolder!=''){
        this.file.checkDir(path, mediaFolder).then(
          () => {
            console.log("Existe")
          },
          err => {
            console.log("Creado")
            this.file.createDir(path, mediaFolder, false);
          }
        );
    }
  }


  async opcionesVideo() {
    const alert = await this.alertController.create({
      header: 'Nombre',
      inputs: [
        {
          name: 'Calidad',
          type: 'text',
          placeholder: 'Calidad (1=alta / 0=baja)'
        },
        {
          name: 'Duracion',
          type: 'text',
          placeholder: 'Duracion (sg)'
        }
      ],
      buttons: [{ text: 'Aceptar',
          handler: () => {
            console.log('Confirm Ok');
          }
        }
      ]
    });

    await alert.present();
    let result = await alert.onDidDismiss();
    mediaDuracion=result.data.values.Duracion;
    mediaCalidad=result.data.values.Calidad;
    console.log('Duracion -> ' + mediaDuracion.valueOf());
  }
}