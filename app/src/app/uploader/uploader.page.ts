import { Component, OnInit, NgModule } from '@angular/core';
import { storage, initializeApp } from 'firebase';
import config from 'src/app/firebase';
import { Camera, CameraOptions, PictureSourceType } from '@ionic-native/camera/ngx';
import { BrowserModule }    from '@angular/platform-browser';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { AngularFirestore } from '@angular/fire/firestore';
import { UserService } from 'src/app/user.service';
import { firestore } from 'firebase/app'
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-uploader',
  templateUrl: './uploader.page.html',
  styleUrls: ['./uploader.page.scss'],
})
export class UploaderPage implements OnInit {

  selectedFile: File = null;
  imageURL: string;
  url
  file: string
  desc: string = "" 
  noFace: boolean = false
  busy: boolean = false

  scaleCrop: string = '-/scale_crop/200x200'
  effects = {
    effect1: '',
    effect2: '-/exposure/50/-/saturation/50/-/warmth/-30/',
    effect3: '-/filter/vevera/100/',
    effect4: '-/gamma/150/',
    effect5: '-/gamma/70/',
    effect6: '-/filter/calarel/',
    effect7: '-/filter/carris/',
    effect8: '-/filter/ferand/',
    effect9: '-/filter/zevcen/',
    effect10: '-/filter/sedis/'
  }

  activeEffect: string = this.effects.effect1

  constructor(
    public http: HttpClient, 
    private camera: Camera,
    public afstore: AngularFirestore,
    public user: UserService,
    private alertController: AlertController,
    private router: Router
  ) { }
  
    ngOnInit() {
  }

  async createPost() {
    this.busy = true
    if(this.desc == "") {
      this.desc = "-No description-"
    }
    const image = this.url
    const activeEffect = this.activeEffect
    const desc = this.desc
    this.afstore.doc(`users/${this.user.getUID()}`).update({
      posts: firestore.FieldValue.arrayUnion(`${image}/${activeEffect}`) // Previous[{"image1", "desc1"},{"image2", "desc2"}] ... Now["iamge1","image2"]
    })
    this.afstore.doc(`posts/${image}`).set({
      desc,
      author: this.user.getUsername(),
      likes: [],
      effect: activeEffect
    })

    const alert = await this.alertController.create({
      header: 'Done',
      message: 'Your post is completed!',
      buttons: ['Cool!']
    })

    await alert.present()
    
    this.url = ""
    this.desc = ""
    this.activeEffect = this.effects.effect1
    this.busy = false
    this.router.navigate(['/tabs/feed'])
  }

  // async takePhoto() {
  //   try {
      
  //   //defining camera options
  //     const options: CameraOptions = {
  //       quality: 50,
  //       targetHeight: 600,
  //       targetWidth: 600,
  //       destinationType: this.camera.DestinationType.DATA_URL,
  //       encodingType: this.camera.EncodingType.JPEG,
  //       mediaType: this.camera.MediaType.PICTURE,
  //       correctOrientation: true
  //     }
  //     const result = await this.camera.getPicture(options);
  //     const image = `data:image/jpeg;base64,${result}`;
  //     const pictures = storage().ref('captures/myphoto');
  //     pictures.putString(image, 'data_url');
  //   } catch(e) {
  //       console.error(e);
  //   }

  // }

  setSelected(effect: string) {
    this.activeEffect = this.effects[effect]
  }

  fileChanged(event) {
    this.busy = true

    const files = event.target.files;

    const fileReader: FileReader = new FileReader();

    fileReader.readAsDataURL(event.target.files[0]); // read file as data url

    fileReader.onload = (event) => { // called once readAsDataURL is completed
      this.imageURL = fileReader.result.toString();
    }
    

    const fd = new FormData()
    fd.append('file', files[0])
    fd.append('UPLOADCARE_STORE', '1')
    fd.append('UPLOADCARE_PUB_KEY', '2c27d9fc42f360560f3e')

    this.http.post('https://upload.uploadcare.com/base/', fd, {
      reportProgress: true,
      observe: 'events'
    })
    .subscribe(event => {
      if(event.type === HttpEventType.UploadProgress) {
        console.log('Upload Progress: ' + Math.round(event.loaded / event.total * 100) + '%')
      } else if(event.type === HttpEventType.Response) {
        console.log(event)
        this.url = event.body['file'].toString();
        this.busy = false
        this.http.get(`https://ucarecdn.com/${this.url}/detect_faces/`)
        .subscribe(ev => {
          this.noFace = ev['faces'] == 0
          console.log(this.noFace)
        })
      }
    })
  }
}
