import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import { UserService } from 'src/app/user.service';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.page.html',
  styleUrls: ['./edit-profile.page.scss'],
})
export class EditProfilePage implements OnInit {

  mainuser: AngularFirestoreDocument
  sub
  username: string
  profilePic: string
  password: string
  newpassword: string
  busy: boolean = false
  uid: string = ""

  constructor(
    public http: HttpClient, 
    public afs: AngularFirestore,
    public user: UserService,
    private alertController: AlertController,
    private router: Router
  ) { 
    this.mainuser = afs.doc(`users/${user.getUID()}`)
    this.sub = this.mainuser.valueChanges().subscribe(event => {
      this.username = event.username
      this.profilePic = event.profilePic
    })
  }

  ngOnInit() {
  }

  ngOnDstroy() {
    this.sub.unsubscribe()
  }

  uploadPic(event) {
    const files = event.target.files
    console.log(files[0])

    const data = new FormData()
    data.append('file', files[0])
    data.append('UPLOADCARE_STORE', '1')
    data.append('UPLOADCARE_PUB_KEY', '2c27d9fc42f360560f3e')

    this.http.post('https://upload.uploadcare.com/base/', data, {
      reportProgress: true,
      observe: 'events'
    })
    .subscribe(event => {
      if(event.type === HttpEventType.UploadProgress) {
        console.log('Upload Progress: ' + Math.round(event.loaded / event.total * 100) + '%')
      } else if(event.type === HttpEventType.Response) {
          console.log(event.body['file'].toString())
          this.uid = event.body['file'].toString()
          const uuid = this.uid
          this.mainuser.update({
            profilePic: uuid
          })
      }
    }) 
  }

  async presentAlert(title: string, content: string) {
    const alert = await this.alertController.create({
      header: title,
      message: content,
      buttons: ['OK']
    })

    await alert.present()
  }

  async updateDetails() {
    this.busy = true;

    if(!this.password) {
      this.busy = false
      return this.presentAlert('Error', 'Please enter your current password')
    }

    try {
      await this.user.reAuth(this.user.getUsername(), this.password)
    } catch(error) {
       this.busy = false
       return this.presentAlert('Error', 'Incorect password!')
    }

    
    if(this.newpassword) {
      await this.user.updatePassword(this.newpassword)
    }

    if(this.username !== this.user.getUsername()) {
      await this.user.updateEmail(this.username)
      this.mainuser.update({
        username: this.username
      })
    }

    this.password = ""
    this.newpassword = ""
    this.uid = ""
    this.busy = false

    await this.presentAlert('Done!', 'Your profile was updated!')

    this.router.navigate(['/tabs/profile'])
  }

}
