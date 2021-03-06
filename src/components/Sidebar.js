import React, {useEffect, useState, useCallback} from 'react';
import "./Sidebar.css"
import Contact from "./Contact"
import firebase from "../firebase"
import {withRouter, Link } from 'react-router-dom';
import Avatar from '@material-ui/core/Avatar';
import ClickAwayListener from '@material-ui/core/ClickAwayListener'
import Menu from '@material-ui/core/Menu'
import MenuItem from '@material-ui/core/MenuItem'
import AddCircleTwoToneIcon from '@material-ui/icons/AddCircleTwoTone'
import SettingsTwoToneIcon from '@material-ui/icons/SettingsTwoTone'
import ImageUpload from "./ImageUpload"
import ArrowDropDownCircleTwoToneIcon from '@material-ui/icons/ArrowDropDownCircleTwoTone';

const SidebarHeader = withRouter(props => {
    const {currentUser} = props
    const [status, setStatus] = useState()

    useEffect(() => {
        setStatus(currentUser.status)
    }, [currentUser])

    const [statusExpanded, setStatusExpanded] = useState(false)
    const [headerExpanded, setHeaderExpanded] = useState(false)

    return (
        <div id="profile" className={headerExpanded ? "expanded" : ""} >
                <div className="wrap">
                    <ClickAwayListener onClickAway={() => setStatusExpanded(false)}>
                    <div className={`profile-img ${status}`}><Avatar alt={currentUser?.name?.toUpperCase()} src={currentUser.profilePicture} onClick={() => setStatusExpanded(s => !s)}  /></div>
                    </ClickAwayListener>
                    <div className="user">
                        <p className="display-name">{currentUser.name}</p>
                    <ArrowDropDownCircleTwoToneIcon className="expand-button" onClick={() => setHeaderExpanded(s => !s)} aria-hidden="true"/>
                    </div>
                    <div id="status-options" className={statusExpanded ? "active" : ""}>
                        <ul>
                            {["online", "away", "busy", "offline"].map(sttus => (
                                <li 
                                    onClick={() => props.updateUser(sttus)} 
                                    id={`status-${sttus}`} 
                                    className={status === sttus ? "active" : ""}
                                    key={sttus}
                                >
                                    <span className="status-circle"></span><p>{sttus}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                <div id="expanded" className={headerExpanded ? "expanded" : ""}> 
                        <ImageUpload className="profile-preview" value={currentUser.profilePicture} center/>
                </div>
            </div>
        </div>
    )
})


const Sidebar = withRouter(props => {
    const [contacts, setContacts] = useState([])
    const [userData, setUserData] = useState({})
    const [anchorEl, setAnchorEl] = useState(null);

    const currentUser = firebase.auth.currentUser

    const getUser = useCallback(async () => {
        const db = firebase.db
        if (currentUser) {
            const unsubA = db.collection("users").doc(currentUser.uid).onSnapshot(doc => {
                const userdata = { ...doc.data(), id: doc.id }
                setUserData(userdata)
            })
            const unsubB = db.collection("conversations").onSnapshot(async snapshot => {
                const contacts = [].concat.apply([], snapshot.docs.map(doc => doc.data()).filter(doc => doc.members.includes(firebase.auth.currentUser.uid)).map(conv => {return {members: conv.members, newest: conv.newest}}))
                let final = []
                for (const contact of contacts.sort((b, a) => a.newest?.sentAt - b.newest?.sentAt)){
                    const id = contact.members.filter(id => id !== firebase.auth.currentUser.uid)[0]
                    const newest = contact.newest
                    final.push({id,newest})
                }
                setContacts(final)
            })
            return () => {
                unsubA()
                unsubB()
            }
        }
    },[currentUser])

    const updateUser = useCallback(async (status) => {
        const db = firebase.db
        if(status){
            db.collection("users").doc(currentUser.uid).update({
                status
            })
        }
    },[currentUser])

    useEffect(() => {
        getUser() // eslint-disable-next-line
    }, [currentUser])

    const handleClick = useCallback((e) => {
        setAnchorEl(e.currentTarget)
    },[])

    const handleClose = useCallback(() => {
        setAnchorEl(null)
    },[])

    const handleLogout = useCallback(async () => { 
        await firebase.logout()
        props.history.push("/") 
    },[props.history])

    return (
        <nav className="sidepanel">
            <SidebarHeader updateUser={updateUser} currentUser={userData}/>
            <div id="search">
                <label htmlFor="contact-search"><i className="fa fa-search" aria-hidden="true"></i><span style={{ opacity: 0 }}>This sentence is invisible</span></label>
                <input id="contact-search" type="text" placeholder="Search contacts..." />
            </div>
            <div id="contacts">
                <ul>
                    {contacts?.map((c, i) => (
                        <Contact key={i} contact={c.id} recent={c.newest} />
                    ))}
                </ul>
            </div>
            <footer id="bottom-bar">
                <Link to="/conversations/new" id="addcontact" className="bottom-button">
                    <span className="footer-button-span">
                        <AddCircleTwoToneIcon/>
                    <span className="footertip"> New Chat</span>
                </span></Link>
                <button className="bottom-button" aria-controls="simple-menu" aria-haspopup="true" onClick={handleClick}>
                    <span className="footer-button-span">
                        <SettingsTwoToneIcon/> 
                        <span className="footertip">Settings</span>
                    </span>
                </button>
                <Menu
                    id="simple-menu"
                    anchorEl={anchorEl}
                    keepMounted
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                >
                    {/* <MenuItem onClick={handleClose}>Profile</MenuItem>
                    <MenuItem onClick={handleClose}>My account</MenuItem> */}
                    <MenuItem onClick={props.toggleColorMode}>Toggle Dark/Light Mode</MenuItem>
                    <MenuItem onClick={handleLogout}>Logout</MenuItem>
                </Menu>
            </footer>
        </nav>

    );
})

export default Sidebar;
