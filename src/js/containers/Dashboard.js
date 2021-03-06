import React, { Component } from 'react'
import { Link } from 'react-router'

import Intro from '../components/Intro'
import NetworkRequest from '../NetworkRequest'
import Footer from '../components/Footer'
import Switch from '../components/Switch'
import TimeJS from '../time'
import Tags from '../components/Tags'
import Geocoder from './Geocoder'
import Signin from '../components/Signin'
import Localization from '../localization/Localization'
import HallOfFame from '../components/HallOfFame'

class Dashboard extends Component {

  constructor(props) {
    super(props)

    // Get posible notifications
    const notifications = JSON.parse(localStorage.getItem('notifications'))
    const newUser = notifications.includes('0') || notifications.includes(0)

    this.state = {
      hallOfFame: [],
      remainingTime: 0,
      introVisible: newUser,
      // Set state
      working: true,
      liking: false,
      commenting: false,
      following: false,
      unfollowing: false,
      speed: false,
      commentForComment: false,
      showAlertFollow: false,
      comment: '',
      commentChanged: false,
      // filters
      filtertags: [],
      filterusers: [],
      filterkeys: [],
      // Targeting
      tags: [],
      locations: [],
      gender: 0,
      usernames: [],
      // Location
      value: null,
      // Hall of fame usage
      instagram_id: '',
      // Statistics
      likes: 0,
      follows: 0,
      unfollows: 0,
      comments: 0,
      // track if settings has changed
      changed:false,
      // handle password changes
      showSignin: false,
      // handle verify account
      verifyAccount: false,
      //username
      username: '',
      //profile picture
      profile_picture: '',
      //famous
      famous: false,
      //hall of fame of followings
      hallOfFollowing: [],
      // automation is active
      automationActive: false
    }

    this.onLikingChange = this.onLikingChange.bind(this)
    this.onCommentingChange = this.onCommentingChange.bind(this)
    this.onFollowingChange = this.onFollowingChange.bind(this)
    this.onUnfollowingChange = this.onUnfollowingChange.bind(this)
    this.onSpeedChange = this.onSpeedChange.bind(this)
    this.onCommentForCommentChange = this.onCommentForCommentChange.bind(this)
    this.removeNotification = this.removeNotification.bind(this)
    this.onTagsChange = this.onTagsChange.bind(this)
    this.onLocationsChange = this.onLocationsChange.bind(this)
    this.onSelect = this.onSelect.bind(this)
    this.onCommentChange = this.onCommentChange.bind(this)
    this.onFollow = this.onFollow.bind(this)
    this.startAutomation = this.startAutomation.bind(this)
    this.restartAutomation = this.restartAutomation.bind(this)
    this.onFilterTagsChange = this.onFilterTagsChange.bind(this)
    this.onFilterUsersChange = this.onFilterUsersChange.bind(this)
    this.onFilterKeysChange = this.onFilterKeysChange.bind(this)
    this.updateComment = this.updateComment.bind(this)
  }

  tick() {
    if (this.state.remainingTime > 0) {
      this.setState((prevState) => ({
        remainingTime: prevState.remainingTime - 1
      }))
    }
    else {
      this.setState((prevState) => ({
        remainingTime: 0
      }))
    }
  }

  updateComment() {
    NetworkRequest.updateComment(this.state.comment)
    .then((response) => {
      this.setState({
        changed: true,
        commentChanged: false
      })
      localStorage.setItem('user', JSON.stringify(response.data.user))
      this.setState({
        comment: response.data.user.preferences.comment_text
      })
    })
    .catch((error) => {
      // TODO: catch error
      console.log(error)
    })
  }

  onFollow(newTimeEnd) {
    const remainingTime = Math.floor(newTimeEnd/1000) - Math.floor(Date.now()/1000)
    this.setState({
      remainingTime
    }, () => {
      clearInterval(this.interval)
      this.interval = setInterval(() => this.tick(), 1000)
      if (!this.state.automationActive) this.startAutomation()
    })
  }

  onTagsChange(tags) {
    document.getElementById('tags-loader').classList.remove('hidden')
    NetworkRequest.setTags(tags)
    .then((response) => {
      this.setState({
        changed: true
      })
      const user = response.data.user
      // Update local information
      localStorage.setItem('user', JSON.stringify(response.data.user))
      document.getElementById('tags-loader').classList.add('hidden')
    })
    .catch((error) => {
      // TODO: handle error
      console.log(error)
      document.getElementById('tags-loader').classList.add('hidden')
    })
  }

  onCommentChange(event) {
    const { value, name } = event.target
    this.setState({
      [name]: value,
      commentChanged: true
    })
  }

  onLocationsChange(localizations) {
    document.getElementById('locations-loader').classList.remove('hidden')
    NetworkRequest.setLocations(localizations)
    .then((response) => {
      this.setState({
        changed: true
      })
      const user = response.data.user
      // Update local information
      localStorage.setItem('user', JSON.stringify(response.data.user))
      document.getElementById('locations-loader').classList.add('hidden')
    })
    .catch((error) => {
      // TODO: handle error
      console.log(error)
      document.getElementById('locations-loader').classList.add('hidden')
    })
  }

  componentWillUnmount() {
    clearInterval(this.interval)
  }

  parseUser(userString) {
    return new Promise((resolve, reject) => {
      try { resolve(JSON.parse(userString)) }
      catch (error) { reject(error) }
    })
  }

  componentWillMount() {
    // Add users to hall of fame
    NetworkRequest.getHallOfFame()
    .then((response) => {
      this.setState({
        hallOfFame: response.data.famous
      })
      // Get the Instagram id
      return NetworkRequest.getInstagramId()
    })
    .then(response => {
      this.setState({
        instagram_id: response.data.instagram.instagram.id
      })

      return NetworkRequest.getHallOfFollowing()
    })
    .then(response => {
      this.setState({
        hallOfFollowing: response.data.famous
      })
    })
    .catch((error) => {
      // TODO: handle error
      console.log(error)
    })

    // Get Statistics
    this.onStatsChange()
  }

  componentDidMount() {
    // TODO this is being duplicated as in App we're also getting the profile and setting to localStorage
    NetworkRequest.getProfile()
    .then((response) => {
      const { full_name, _id, profile_picture, username, timeEnd, preferences, fameEnd } = response.data.user
      const user = {
        full_name,
        _id,
        profile_picture,
        username,
        timeEnd,
        fameEnd,
        preferences
      }

      return user
    })
    .then(user => {

      this.setState({
        tags: user.preferences.tags,
        locations: user.preferences.locations,
        liking: user.preferences.liking,
        following: user.preferences.following,
        commenting: user.preferences.commenting,
        unfollowing: user.preferences.unfollowing,
        speed: user.preferences.speed,
        commentForComment: user.preferences.commentForComment,
        changed: user.preferences.changed,
        filtertags: user.preferences.filtertags,
        filterusers: user.preferences.filterusers,
        filterkeys: user.preferences.filterkeys,
        comment: user.preferences.comment_text,
        username: user.username,
        profile_picture: user.profile_picture,
        automationActive: user.automationActive,
        famous: user.fameEnd > Date.now()
      })

      const remainingTime = Math.floor(user.timeEnd/1000) - Math.floor(Date.now()/1000)

      // Check if we have time, so we dont't tick negative dates
      if (remainingTime > 0) {
        this.setState({
          remainingTime
        })
        this.interval = setInterval(() => this.tick(), 1000)
      }
    })
    .catch(error => {
      console.log(error)
    })

    // Conver ISO date to the number of milliseconds since January 1, 1970, 00:00:00
    //State to reload the stats every minute or so
    const reloadTime = 60000
    setInterval( () => this.onStatsChange(), reloadTime)
  }

  removeNotification() {
    const notifications = JSON.parse(localStorage.getItem('notifications'))
    notifications.splice(notifications.indexOf('0'), 1)

    localStorage.setItem('notifications', JSON.stringify(notifications))
  }

  onSelect(value){
    this.setState({ value: value })
  }

  onStatsChange(){
    // Get stats for bot
    NetworkRequest.getAutomationStats()
    .then((response) => {
      const stats = response.data.stats
      this.setState({
        likes: stats.likes.length,
        follows: stats.follows.length,
        unfollows: stats.unfollows.length,
        comments: stats.comments.length
      })
    })
    .catch((error) => {
      // TODO: handle error
      console.log(error)
    })
  }

  onLikingChange() {
    NetworkRequest.updateLiking(!this.state.liking)
    .then((response) => {
      localStorage.setItem('user', JSON.stringify(response.data.user))
      this.setState({
        liking: response.data.user.preferences.liking,
        changed: true
      })
    })
    .catch((error) => {
      // TODO: catch error
      console.log(error)
    })
  }

  onCommentingChange() {
    NetworkRequest.updateCommenting(!this.state.commenting)
    .then((response) => {
      localStorage.setItem('user', JSON.stringify(response.data.user))
      this.setState({
        changed: true,
        commenting: response.data.user.preferences.commenting
      })
    })
    .catch((error) => {
      // TODO: handle error
      console.log(error)
    })
  }

  onFilterTagsChange(filtertags) {
    document.getElementById('blackhashtags-loader').classList.remove('hidden')
    NetworkRequest.setFilteredTags(filtertags)
    .then((response) => {
      this.setState({
        changed: true
      })
      const user = response.data.user
      // Update local information
      localStorage.setItem('user', JSON.stringify(response.data.user))
      document.getElementById('blackhashtags-loader').classList.add('hidden')
    })
    .catch((error) => {
      // TODO: handle error
      console.log(error)
      document.getElementById('blackhashtags-loader').classList.add('hidden')
    })
  }

  onFilterUsersChange(filterusers) {
    document.getElementById('blackusers-loader').classList.remove('hidden')
    NetworkRequest.setFilteredUsers(filterusers)
    .then((response) => {
      this.setState({
        changed: true
      })
      const user = response.data.user
      // Update local information
      localStorage.setItem('user', JSON.stringify(response.data.user))
      document.getElementById('blackusers-loader').classList.add('hidden')
    })
    .catch((error) => {
      // TODO: handle error
      console.log(error)
      document.getElementById('blackusers-loader').classList.add('hidden')
    })
  }

  onFilterKeysChange(filterkeys) {
    document.getElementById('blackkeywords-loader').classList.remove('hidden')
    NetworkRequest.setFilteredKeys(filterkeys)
    .then((response) => {
      this.setState({
        changed: true
      })
      const user = response.data.user
      // Update local information
      localStorage.setItem('user', JSON.stringify(response.data.user))
      document.getElementById('blackkeywords-loader').classList.add('hidden')
    })
    .catch((error) => {
      // TODO: handle error
      console.log(error)
      document.getElementById('blackkeywords-loader').classList.add('hidden')
    })
  }

  onFollowingChange() {
    NetworkRequest.updateFollowing(!this.state.following)
    .then(response => {
      localStorage.setItem('user', JSON.stringify(response.data.user))
      const following = response.data.user.preferences.following
      this.setState({
        following,
        changed: true
      })
      return following
    })
    .then(following => {
      if (!following) {
        NetworkRequest.updateUnfollowing(false)
        .then(response => {
          this.setState({
            unfollowing: response.data.user.preferences.unfollowing
          })
        })
      }
    })
    .catch(error => {
      // TODO: handle error
      console.log(error)
    })
  }

  onUnfollowingChange() {

    // Check if following is active
    if (!this.state.following) {
      this.setState({
        showAlertFollow: true,
        following: false,
      },
      setTimeout(() => {
        this.setState({
          showAlertFollow: false
        })
      }, 4000))
      return
    }

    NetworkRequest.updateUnfollowing(!this.state.unfollowing)
    .then(response => {
      localStorage.setItem('user', JSON.stringify(response.data.user))
      this.setState({
        changed: true,
        unfollowing: response.data.user.preferences.unfollowing
      })
    })
    .catch(error => {
      // TODO: handle error
      console.log(error)
    })

  }

  onSpeedChange() {
    if(!this.state.speed) alert(Localization.speed_alert)
    NetworkRequest.updateSpeed(!this.state.speed)
    .then((response) => {
      localStorage.setItem('user', JSON.stringify(response.data.user))
      this.setState({
        speed: response.data.user.preferences.speed,
        changed: true
      })
    })
    .catch((error) => {
      // TODO: catch error
      console.log(error)
    })
  }

  onCommentForCommentChange() {
    NetworkRequest.updateCommentForComment(!this.state.commentForComment)
    .then((response) => {
      localStorage.setItem('user', JSON.stringify(response.data.user))
      this.setState({
        commentForComment: response.data.user.preferences.commentForComment,
        changed: true
      })
    })
    .catch((error) => {
      // TODO: catch error
      console.log(error)
    })
  }

  startAutomation() {
    NetworkRequest.startAutomation()
    .then(response => {
      this.setState({
        automationActive: true
      })
    })
    .catch(error => {
      if (error.response.status === 401){
        this.setState({
          showSignin:true
        })
      }
      if (error.response.status === 418){
        this.setState({
          verifyAccount:true
        })
      }
    })
  }

  restartAutomation(){
    NetworkRequest.stopAutomation()
    .then(response => {
      this.setState({
        changed: false
      })
      NetworkRequest.updateChanged(false)
      .then(response => {
        this.startAutomation()
      })
    })
    .catch(error => {
      console.log(error)
    })
  }

  render() {

    let { days, hours, minutes, seconds } = TimeJS.getComponents(this.state.remainingTime)

    return (
      <div className='dashboard'>
        <div className='hero-dashboard'></div>
        <Signin
          show={this.state.showSignin}
          id='dashboard' title={Localization.update}
          username={this.state.username}
          disabled={true}/>
        <Signin
          show={this.state.verifyAccount}
          id='dashboard' title={Localization.verify}
          username={this.state.username}
          verifyAccount={this.state.verifyAccount}
          isModule={true}/>
        <Intro
          visible={this.state.introVisible}
          onEnd={this.removeNotification}/>
        <div className='content-section'>
          {
            this.state.hallOfFame.length || this.state.hallOfFollowing.length || this.state.famous
            ? <HallOfFame
                famous={this.state.famous}
                username={this.state.username}
                profilePicture={this.state.profile_picture}
                onFollow={this.onFollow}
                hallOfFollowing={this.state.hallOfFollowing}
                hallOfFame={this.state.hallOfFame}
              />
            : undefined
          }
          <div className='main-section'>
            <div className='section center'>
              <div className={`time-card main ${this.state.remainingTime > 0 ? 'working' : 'stoped'}`}>
                <div className='label-wrapper'>
                  <label>{Localization.remaining}</label>
                  { this.state.changed
                    ? <div className="restart-wrapper">
                        <label
                          onClick={this.restartAutomation}
                          className={`button ${this.state.working ? 'restart' : ''}`}>{this.state.working ? Localization.restart : 'Start'}</label>
                        <div className="warning">
                          <h6>Update</h6>
                          <p>Please update to apply changes</p>
                        </div>
                      </div>
                    : <label></label> }
                </div>
                <h1>{ days===1 ? `${days} ${Localization.day}` : `${days} ${Localization.days}`}</h1>
                <h2>{`${hours}:${minutes}:${seconds}`}</h2>
              </div>
            </div>
            <div className='section switching'>
              <div className='switch-section'>
                <span className={`liking ${this.state.liking ? 'active' : '' }`}>{Localization.liking}</span>
                <div className='switch-counter'>
                  <span>{this.state.likes}</span>
                  <Switch id="0" onChange={this.onLikingChange} active={this.state.liking}/>
                </div>
              </div>
              <div className='switch-section'>
                <span className={`following ${this.state.following ? 'active' : '' }`}>{Localization.following}</span>

                <div className={`inline-error ${this.state.showAlertFollow ? 'active' : 'hidden'}`}>
                  <div className='caret left'></div>
                  <span className='title'>{Localization.need}</span>
                  <p>{Localization.need_exp}</p>
                </div>
                <div className='switch-counter'>
                  <span>{this.state.follows}</span>
                  <Switch id="1" onChange={this.onFollowingChange} active={this.state.following}/>
                </div>
              </div>
              <div className='switch-section'>
                <span className={`unfollowing ${this.state.unfollowing ? 'active' : '' }`}>{Localization.unfollowing}</span>
                <div className='switch-counter'>
                  <span>{this.state.unfollows}</span>
                  <Switch id="2" onChange={this.onUnfollowingChange} active={this.state.unfollowing}/>
                </div>
              </div>
              <div className='switch-section'>
                <span className={`commenting ${this.state.commenting ? 'active' : '' }`}>{Localization.commenting}</span>
                <div className='switch-counter'>
                  <span>{this.state.comments}</span>
                  <Switch id="3" onChange={this.onCommentingChange} active={this.state.commenting}/>
                </div>
              </div>
              <div className={`commenting-field ${this.state.commenting ? '' : 'hidden' }`}>
                <input
                  type="text"
                  placeholder={Localization.add_comment}
                  onChange={this.onCommentChange}
                  name='comment'
                  value={this.state.comment || ''} />
                  <input
                    type="button"
                    value="OK"
                    onClick={this.updateComment}
                    className={`red ${this.state.commentChanged ? '' : 'hidden'}`} />
              </div>
            </div>
            <div className='section'>
              <div className='section-title'>
                <h4 className='filters'>{Localization.filters}</h4>
              </div>
            </div>
            <div className='section'>
              <div className='title'>
                <div className='hint'><span><b>{Localization.hashtags_hint}</b>{Localization.hashtags_hexp}</span></div>
                <h4>{Localization.hashtags}</h4>
                <div className='loader small hidden' id='tags-loader'></div>
              </div>
              <Tags onChange={this.onTagsChange} tags={this.state.tags} placeholder={Localization.separated}/>
            </div>
            <div className='section'>
              <div className='title'>
                <div className='hint'><span><b>{Localization.locations_hint}</b>{Localization.locations_hexp}</span></div>
                <h4>{Localization.locations}</h4>
                <div className='loader small hidden' id='locations-loader'></div>
              </div>
               <Geocoder
                 accessToken='pk.eyJ1IjoiZmF0YWxyYWluY2xvdWQiLCJhIjoiY2oyMjRiOHd5MDAwazJxbWs0YmZ6ZmV1cSJ9.IsBKnV_Eu9clUU3PVxRMAA'
                 onSelect={this.onSelect}
                 showLoader={true}
                 onChange={this.onLocationsChange}
                 locations={this.state.locations} />
            </div>
            <div className='section'>
              <div className='section-title'>
                <h4 className='exceptions'>{Localization.blacklist}</h4>
              </div>
            </div>
            <div className='section'>
              <div className='title'>
                <div className='hint'><span><b>{Localization.hashtag_hint}</b>{Localization.hashtag_hexp}</span></div>
                <h4>{Localization.hashtag}</h4>
                <div className='loader small hidden' id='blackhashtags-loader'></div>
              </div>
              <Tags onChange={this.onFilterTagsChange} tags={this.state.filtertags} placeholder={Localization.separated}/>
            </div>
            <div className='section'>
              <div className='title'>
                <div className='hint'><span><b>{Localization.username_hint}</b>{Localization.username_hexp}</span></div>
                <h4>{Localization.username}</h4>
                <div className='loader small hidden' id='blackusers-loader'></div>
              </div>
              <Tags onChange={this.onFilterUsersChange} tags={this.state.filterusers} placeholder={Localization.usernames_sep}/>
            </div>
            <div className='section'>
              <div className='title'>
                <div className='hint'><span><b>{Localization.keyword_hint}</b>{Localization.keyword_hexp}</span></div>
                <h4>{Localization.keyword}</h4>
                <div className='loader small hidden' id='blackkeywords-loader'></div>
              </div>
              <Tags onChange={this.onFilterKeysChange} tags={this.state.filterkeys} placeholder={Localization.keyword_sep}/>
            </div>
            <div className='section'>
              <div className='speed'>
                <h4 className='exceptions'>{Localization.speed_mode}</h4>
                <div className='hint'><span><b>{Localization.speed_title}</b>{Localization.speed_hint}</span></div>
              </div>
            </div>
            <div className='section switching'>
              <div className='switch-section'>
                <span className={`speed ${this.state.speed ? 'active' : '' }`}>{Localization.speed}</span>
                <div className='switch-counter'>
                  <Switch id="4" onChange={this.onSpeedChange} active={this.state.speed}/>
                </div>
              </div>
          </div>
          </div>
        </div>
        <Footer loggedin={true}></Footer>
      </div>
    )
  }

}

export default Dashboard
