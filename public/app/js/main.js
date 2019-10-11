"use strict";

window.onload = main;

const fs = firebase.firestore();

function main() {
	// Serviceworker is anoying during debugging
	// register_service_worker();
	scale_in_title();
	ripple_init();
	set_bottom_navigation_click();
	window.setTimeout(() => {
		check_logged_in();
	}, 500);
}

function upload_avatar() {
	// make path random keys
	var filePath = firebase.auth().currentUser.uid + '/' + messageRef.id + '/' + file.name;
	return firebase.storage().ref(filePath).put(file).then(function (fileSnapshot) {
		return fileSnapshot.ref.getDownloadURL().then((url) => {
			return messageRef.update({
				imageUrl: url,
				storageUri: fileSnapshot.metadata.fullPath
			});
		});
	});
}

function set_menu_button_click() {
	const menu_button = document.getElementById("menu-button");
	menu_button.onclick = () => {
		menu_button.classList.add("active");
	};
}

function set_bottom_navigation_click() {
	// Set onclick for each destination
	const targets = document.getElementsByClassName("bottom-navigation-destination");
	for (const target of targets) {
		target.addEventListener("click", bottom_navigation_click);
	}
}

function bottom_navigation_click(event) {
	// Give only clicked destination active class and remove it from others 
	const element = event.currentTarget;
	const siblings = element.parentNode
		.getElementsByClassName("bottom-navigation-destination");
	let clicked_el_index;
	for (let i = 0; i < siblings.length; i++) {
		siblings[i].classList.remove("active");
		if (siblings[i] === event.currentTarget) {
			clicked_el_index = i;
		}
	}
	element.classList.add("active");
	hide_top_level_destinations();
	// Call corresponding displaying function
	[display_map, display_chat, display_account][clicked_el_index]();

}

function hide_top_level_destinations() {
	// Display hiding animation
	const destinations = document
		.getElementsByClassName("top-level-destination");
	for (const destination of destinations) {
		destination.classList.remove("active");
	}
	const contacts = document.getElementById("contact-list").children;
	for (let contact of contacts)
		contact.classList.remove("active");
	// Actually hide
	window.setTimeout(() => {
		for (const destination of destinations) {
			if (!destination.classList.contains("active"))
				destination.style.display = "none";
		}
	}, 50);
}

function display_map() {
	document.getElementById("map-screen").style.display = "block";
	window.setTimeout(() => {
		document.getElementById("map-screen").classList.add("active");
	}, 40);
}

function display_chat() {
	const chat_screen = document.getElementById("chat-screen");
	const contacts = document.getElementById("contact-list").children;
	chat_screen.style.display = "block";
	for (let i = 0; i < contacts.length; i++) {
		window.setTimeout(() => {
			contacts[i].classList.add("active");
		}, 35 * (i + 1));
	}
	window.setTimeout(() => { chat_screen.classList.add("active") }, 25)
	set_add_fren_on_click();
	set_new_group_on_click();
	set_contact_on_click();
}

function display_account() {
	document.getElementById("account-screen").style.display = "block";
	window.setTimeout(() => {
		document.getElementById("account-screen").classList.add("active");
	}, 25);
}

function set_add_fren_on_click() {
	const ボタン = document.getElementById("add-friend");
	ボタン.addEventListener("mouseup", display_add_fren);
}

function set_new_group_on_click() {
	const ボタン = document.getElementById("create-group");
	ボタン.addEventListener("mouseup", new_group_dialog);
}

function new_group_dialog() {
	open_dialog("Create a new group", `<div class="create-group">
		<div class="form-element form-input">
			<input id="create-group-name" class="form-element-field"
				placeholder="" type="input" required />
			<div class="form-element-bar"></div>
			<label class="form-element-label" for="create-group-name">
				Name your band
			</label>
		</div>
		<div class="members">
		</div>
	</div>`);
	requestAnimationFrame(() => {
		const user_id = firebase.auth().currentUser.uid;
		const dialog = document.getElementsByClassName("dialog")[0];
		const footer = dialog.getElementsByClassName("dialog-footer")[0];
		const container = dialog.getElementsByClassName("members")[0];
		// Display all contacts so that you can select members
		fs.collection("friendlists").doc(user_id).get().then(doc => {
			for (const uid of doc.data().uid) {
				fs.collection("users").doc(uid).get().then(fren => {
					const data = fren.data();
					display_friend_for_new_group(container, data.image,
						data.display, uid);
				});
			}
		});
		// Create checkmark to click when the user is done
		footer.innerHTML += `<svg xmlns="http://www.w3.org/2000/svg"
			width="24" height="24" viewBox="0 0 24 24"
			style="position: absolute; right: 4px; bottom: 4px;
			padding: 12px; cursor: pointer;">
			<path fill="none" d="M0 0h24v24H0z"/>
			<path fill="#f5f5f5" d="M9 16.2L4.8 12l-1.4 1.4L9 19
				21 7l-1.4-1.4L9 16.2z"/>
		</svg>`;
		requestAnimationFrame(() => {
			footer.lastChild.addEventListener("click", (e) => {
				create_new_group(dialog);
			});
		});
	});
}

function display_friend_for_new_group(container, img, name, id) {
	container.innerHTML += `<div class="contact ripple active" id="${id}">
						<img class="contact-image" alt="Profile picture"/>
						<section class="contact-text">
							<div class="contact-name"></div>
							<div class="contact-last-message">Click to select</div>
						</section>
					</div>`;
	const div = container.querySelector("#" + id);
	div.setAttribute("data-group-id", id);
	div.getElementsByClassName("contact-image")[0].src = img;
	div.getElementsByClassName("contact-name")[0].innerText = name;
	div.addEventListener("click", (e) => e.currentTarget.classList.toggle("selected"));
}

function create_new_group(dialog) {
	const user_id = firebase.auth().currentUser.uid;
	const members = Array.from(dialog
		.querySelectorAll(".members .contact.selected"))
		.map((contact) => contact.getAttribute("data-group-id"))
		.concat(user_id);
	const name = dialog.querySelector("#create-group-name").value;
	fs.collection("groups").add({
		members: members,
		admins: user_id,
		last_message: "New group",
		name: name,
		image: "/images/android-icon-48x48.png"
	});
	tiny_dialog_message(dialog, `Group ${name} was created.`);
}

function tiny_dialog_message(dialog, message, success) {
	const children = dialog.children;
	for (const child of children)
		child.style.opacity = 0;
	dialog.classList.add("tiny");
	dialog.innerHTML += `<svg xmlns="http://www.w3.org/2000/svg"
			width="24" height="24" viewBox="0 0 24 24"
			class="tiny-dialog-checkmark">
			<path fill="none" d="M0 0h24v24H0z"/>
			<path fill="#5a9271" d="M9 16.2L4.8 12l-1.4 1.4L9 19
				21 7l-1.4-1.4L9 16.2z"/>
		</svg>
	<span class="tiny-dialog-centered-text">
		${message}
	</span>`;
	setTimeout(() => {
		dialog.getElementsByClassName("create-group")[0].remove();
		requestAnimationFrame(() => {
			const text = dialog
				.getElementsByClassName("tiny-dialog-centered-text")[0];
			const svg = dialog.getElementsByClassName("tiny-dialog-checkmark")[0];
			[text, svg].forEach(element => {
				element.style.opacity = 1;
			});
		});
	}, 120);
	setTimeout(() => close_dialog(dialog), 1000);
}

function display_add_fren() {
	open_dialog("Add a new friend", `<div class="dialog-header">
			<div class="dialog-tab active" data-target="send">Send</div>
			<div class="dialog-tab" data-target="recieve">Recieve</div>
		</div>
		<div class="dialog-destination active" data-name="send">
			<div class="add-fren form-element form-input">
				<input id="friend_search_bar" class="form-element-field"
					placeholder="" type="input" required />
				<div class="form-element-bar"></div>
				<label class="form-element-label" for="friend-search-bar">
					Search for friends</label>
			</div>
			<div class="add-fren-results"></div>
		</div>
		<div class="dialog-destination"
			data-name="recieve" style="display: none;">
			Loading...
		</div>
		`);

	const dialog = document.getElementsByClassName("dialog")[0];
	const input = dialog.getElementsByTagName("input")[0];
	const tabs = dialog.getElementsByClassName("dialog-tab");
	input.addEventListener("keydown",
		(e) => requestAnimationFrame(() => search_for_frens(e)));
	for (let tab of tabs)
		tab.addEventListener("click", display_dialog_tab);
	display_friend_requests(dialog);
}

function display_friend_requests(dialog) {
	const container = dialog
		.querySelector(".dialog-destination[data-name='recieve']");
	const user_id = firebase.auth().currentUser.uid;
	let i = 0;
	fs.collection("friend-requests").doc(user_id).get().then((doc) => {
		if (doc.exists) {
			const 可能な友達 = doc.data().sender;
			if (可能な友達.length == 0)
				no_friend_requests(container);
			for (const snd of 可能な友達) {
				fs.collection("users").doc(snd).get().then(ユーザー => {
					if (ユーザー.exists) {
						if (i == 0)
							container.innerText = "";
						container.innerHTML += `<div class="contact active">
							<img class="contact-image"/>
								<section class="contact-text">
									<div class="contact-name"></div>
									<div class="contact-last-message">
										Accept friend request
									</div>
								</section>
							</div>`;
						const data = ユーザー.data();
						container.getElementsByClassName("contact-image")[i]
							.src = data.image;
						container.getElementsByClassName("contact-name")[i]
							.innerText = data.display;
						container.getElementsByClassName("contact")[i]
							.addEventListener("click", (e) =>
								accept_friend_request(e, snd));
						i++;
					}
				});
			}
		} else no_friend_requests(container);
	});
}

function no_friend_requests(container) {
	container.innerText = "No one wants to be your friend";
}

function accept_friend_request(e, uid) {
	const user_id = firebase.auth().currentUser.uid;
	fs.collection("friendlists").doc(user_id).set({
		uid: firebase.firestore.FieldValue.arrayUnion(uid)
	}, { merge: true });
	fs.collection("accepted-friends").doc(user_id).set({
		uids: firebase.firestore.FieldValue.arrayUnion(uid)
	}, { merge: true });
	fs.collection("groups").add({
		members: [user_id, uid],
		admins: null,
		last_message: "New friend",
		name: null,
		image: "/images/android-icon-48x48.png"
	});
}

function display_dialog_tab(e) {
	const tab = e.target;
	const tabs = document.getElementsByClassName("dialog-tab");
	const target = tab.getAttribute("data-target");
	const dst = document.getElementsByClassName("dialog-destination");
	for (let t of tabs)
		t.classList.remove("active");
	tab.classList.add("active");
	for (let d of dst) {
		if (d.getAttribute("data-name") != target) {
			d.classList.remove("active");
			d.setAttribute("style", "display: none;");
		} else {
			d.setAttribute("style", "display: block;");
			window.setTimeout(() => d.classList.add("active"), 100);
		}
	}
}

function search_for_frens(e) {
	const name = e.target.value;
	const results = e.target.parentNode.parentNode
		.getElementsByClassName("add-fren-results")[0];
	const users = fs.collection("users");
	const query = users.where("display", "==", name);
	let i = 0;
	query.get().then((qs) => {
		results.innerHTML = "";
		qs.forEach((doc) => {
			const data = doc.data();
			const user_id = firebase.auth().currentUser.uid;
			// You can't become friends with yourself
			if (doc.id != user_id) {
				results.innerHTML += `<div class="contact active">
					<img class="contact-image"/>
					<section class="contact-text">
						<div class="contact-name"></div>
						<div class="contact-last-message">
							Send a friend-request</div>
					</section>
				</div>`;
				requestAnimationFrame(() => {
					/* todo: add animation */
					results.getElementsByClassName("contact")[i]
						.addEventListener("click",
							() => send_friend_request(doc.id));
					results.getElementsByClassName("contact-image")[i]
						.src = data.image;
					results.getElementsByClassName("contact-name")[i]
						.innerText = data.display;
					i++;
				});
			}
		});
	});
}

function send_friend_request(uid) {
	const user_id = firebase.auth().currentUser.uid;
	const frq = fs.collection("friend-requests").doc(uid);
	const prq = fs.collection("private-requests").doc(user_id);
	frq.set({ sender: firebase.firestore.FieldValue.arrayUnion(user_id) },
		{ merge: true });
	prq.set({ recipent: firebase.firestore.FieldValue.arrayUnion(uid) },
		{ merge: true });
	fs.collection("users").doc(uid).get()
		.then((doc) =>
			display_snackbar("Sent friend request to " + doc.data().display));
}

function set_contact_on_click() {
	const contacts = document.querySelectorAll("#contact-list .contact");
	for (const contact of contacts) {
		// For some reason click works only about half of the time
		// It sometimes stops working for a while and then it works again
		// I'm using a mouseup event listener instead
		// and it seems to be working fine
		contact.addEventListener("mouseup", contact_click, false);
	}
}

function contact_click(e) {
	const group_id = e.currentTarget.getAttribute("data-id");
	open_dialog(e.currentTarget
		.getElementsByClassName("contact-name")[0].innerText,
		`<div class="progress-indicator indeterminate">
                <div class="progress-indicator__primary-bar">
                    <span class="progress-indicator__bar-inner"></span>
                </div>
                <div class="progress-indicator__secondary-bar">
                    <span class="progress-indicator__bar-inner"></span>
                </div>
        </div>
		<div class="message-container"></div>
		<div class="conversation-input-container">
			<input id="message-input" placeholder="Type a message"
				type="input"/>
			<svg class="send-message" xmlns="http://www.w3.org/2000/svg"
				width="24" height="24" viewBox="0 0 24 24">
				<path fill="#cacaca" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
				<path d="M0 0h24v24H0z" fill="none"/>
			</svg>
		</div>`);
	requestAnimationFrame(() => {
		const dialog = document.getElementsByClassName("dialog")[0];
		const input = dialog.getElementsByTagName("input")[0];
		const arrow = dialog.getElementsByClassName("send-message")[0];
		const messages = dialog.getElementsByClassName("message-container")[0];
		input.addEventListener("keydown", (e) =>
			requestAnimationFrame(() =>
				type_message_on_keydown(e, group_id)));
		arrow.addEventListener("click", () =>
			requestAnimationFrame(() => {
				if (arrow.classList.contains("active")) {
					send_message(group_id, input.value);
					input.value = "";
				}
			}));
		messages.addEventListener("scroll", () =>
			messages_scroll(messages, group_id), { passive: true });
		display_messages(group_id, dialog);
		setTimeout(() => messages.scrollTop = messages.scrollHeight, 500);
	});
}

function messages_scroll(messages, group_id) {
	const dialog = messages.parentNode;
	if (messages.scrollTop == 0) {
		const previous = dialog.getAttribute("data-limit");
		// Unsubscribe from the snapshot listener
		messages.scrollTop += 2;
		messages_listener();
		dialog.setAttribute("data-limit", parseInt(previous) + 12);
		display_messages(group_id, dialog);
	}
}

function open_dialog(title, content) {
	remove_all_dialogs();
	const node = document.createElement('div');
	node.classList.add("dialog");
	node.innerHTML = `<div class="dialog-footer">
		<div class="close-dialog" onclick="close_dialog(this.parentNode.parentNode)">
			<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
				<path fill = #f5f5f5 d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
				<path d="M0 0h24v24H0z" fill="none"/>
			</svg>
		</div>
		<div class="dialog-name">${title}</div>
	</div>
	` + content;
	hide_footer();
	document.getElementsByTagName("main")[0].classList.add("hidden");
	document.getElementsByTagName('body')[0].append(node);
	requestAnimationFrame(() => {
		const dialog = document.getElementsByClassName("dialog")[0];
		dialog.classList.add("open");
	});
}

function remove_all_dialogs() {
	const dialog = document.getElementsByClassName("dialog");
	for (const c of dialog) {
		c.parentNode.removeChild(c);
	}
	document.getElementsByTagName("main")[0].classList.remove("hidden");
	// stop listening for messages
	if (messages_listener != null)
		messages_listener();
	messages_listener = null;
	show_footer();
}

function close_dialog(dialog) {
	dialog.classList.remove("open");
	window.setTimeout(remove_all_dialogs, 100);
}

function hide_footer() {
	document.getElementById("bottom-navigation")
		.classList
		.remove("slide-in");
}

function show_footer() {
	document.getElementById("bottom-navigation")
		.classList
		.add("slide-in");
}

function remove_message(id) {
	const msg = document.getElementById(id);
	if (msg == null) return;
	msg.classList.remove("display");
	setTimeout(() => msg.parentNode.removeChild(msg), 200);
}

function create_message(id, timestamp, image, dialog, me) {
	const message = document.createElement('div');
	message.classList.add("message");
	/* if the message is from the current user then it will be green.
	positioned to the right, and without an avatar */
	message.innerHTML = me ?
		`<span class="message-text"></span>
			<br clear="both"/> `
		: `<img class="message-avatar"/>
			<span class="message-text"></span>`;
	if (me) message.classList.add("from-me");
	else message.getElementsByClassName("message-avatar")[0].src = image;
	message.setAttribute('data-time', timestamp);
	message.setAttribute('id', id);
	// figure out where to insert new message
	const message_list = dialog
		.getElementsByClassName("message-container")[0];
	const existing_messages = message_list.children;
	if (existing_messages.length === 0) {
		message_list.appendChild(message);
	} else {
		let message_list_node = existing_messages[0];
		while (message_list_node) {
			const message_list_node_time
				= message_list_node.getAttribute('data-time');
			if (message_list_node_time > timestamp)
				break;
			message_list_node = message_list_node.nextSibling;
		}
		message_list.insertBefore(message, message_list_node);
	}
	return message;
}

let messages_listener = null;
function display_messages(group_id, dialog) {
	const user_id = firebase.auth().currentUser.uid;
	const limit = parseInt(dialog.getAttribute("data-limit")) || (() => {
		dialog.setAttribute("data-limit", 24);
		return 24;
	})();
	fs.collection("groups").doc(group_id).collection("messages").get()
		.then((col) => {
			if (col.docs.length == 0) {
				messages_remove_loader(dialog);
			}
			messages_listener = create_message_listener(group_id, dialog, limit);
		});
}

function create_message_listener(group_id, dialog, limit) {
	let is_new = limit == 24;
	return fs.collection("groups").doc(group_id)
		.collection("messages").orderBy("time", "desc").limit(limit)
		.onSnapshot((snp) => {
			snp.docChanges().forEach(change => {
				if (is_new) {
					messages_remove_loader(dialog);
					is_new = false;
					const msg = dialog
						.getElementsByClassName("message-container")[0];
					setTimeout(() => {
						msg.scrollTop = msg.scrollHeight;
					}, 250);
					setTimeout(() => {
						msg.scrollTop = msg.scrollHeight;
					}, 500);
				}
				if (change.type === "removed")
					remove_message(change.doc.id);
				else {
					const msg = change.doc.data();
					const id = change.doc.id;
					display_message(dialog, msg.time, msg.sender, msg.text,
						msg.image, id);
				}
			});
		});
}

function display_message(dialog, time, sender, text, image, id) {
	const me = sender == firebase.auth().currentUser.uid;
	const msg = document.getElementById(id) ||
		create_message(id, time, image, dialog, me);
	requestAnimationFrame(() => msg.classList.add("display"));
	msg.setAttribute("data-sender", sender);
	const txt = msg.getElementsByClassName("message-text")[0];
	txt.innerText = text;
	txt.innerHTML = txt.innerHTML.replace(/\n/g, '<br>');
}

function messages_remove_loader(dialog) {
	const loader = dialog.getElementsByClassName("progress-indicator")[0];
	loader.setAttribute("style", "height: 0px;");
	setTimeout(() => loader.parentNode.removeChild(loader), 500);
}

function type_message_on_keydown(e, group_id) {
	if (e.target.value != "") {
		e.target.parentNode.getElementsByTagName("svg")[0]
			.classList.add("active");
		if (e.key == "Enter" && e.target.value) {
			send_message(group_id, e.target.value);
			e.target.value = "";
		}
	} else {
		e.target.parentNode.getElementsByTagName("svg")[0]
			.classList.remove("active");
	}
}

function send_message(group, msg) {
	const user_id = firebase.auth().currentUser.uid;
	const image = firebase.auth().currentUser.photoURL;
	fs.collection("groups").doc(group).collection("messages").add({
		text: msg,
		sender: user_id,
		time: firebase.firestore.Timestamp.now(),
		image: image
	});
	fs.collection("groups").doc(group).update({
		"last_message": msg
	});
}

function scale_in_title() {
	document.getElementById("app-title").classList.add("scale-in");
}

function fade_out_title() {
	document.body.classList.add("loaded");
	// Had to do this twice?
	requestAnimationFrame(function () {
		requestAnimationFrame(function () {
			const app_title = document.getElementById("app-title");
			app_title.classList.add("fade-out");
		});
	});
}

function float_title() {
	document.getElementById("app-title")
		.classList
		.add("float-up");
}

function register_service_worker() {
	if ('serviceWorker' in navigator) {
		navigator.serviceWorker
			.register('/app/sw.js')
			.then(function (registration) {
				console.log('Service Worker Registered at scope ', registration.scope);
			});
		navigator.serviceWorker.ready.then(function (registration) {
			console.log('Service Worker Ready');
		});
	} else {
		console.log("Service worker is unavailable");
	}
}

function check_logged_in() {
	firebase.auth().onAuthStateChanged((user) => {
		if (user) {
			logged_in(user);
		} else {
			float_title();
			display_login_form();
		}
	});
}

function sign_out() {
	firebase.auth().signOut().then(function () {
		display_snackbar("Signed out");
		location.reload();
	}).catch(function (error) {
		display_snackbar(error.message);
	});

}

function display_login_form() {
	const form = document.getElementById("authentication");
	form.classList.add("fade-in");
	form.getElementsByTagName("input")[0].click();
}

function hide_login_form() {
	const login = document.getElementById("authentication");
	login.classList.remove("fade-in");
	fade_out_title();
}

function logged_in(user) {
	console.log("Logged in as " + user.email +
		"\nUser id: " + user.uid +
		"\nDisplayname: " + user.displayName +
		"\nPhoto url: " + user.photoURL +
		"\nEmail verified: " + user.emailVerified);
	if (user.displayName != null)
		display_snackbar("Signed in as " + user.displayName);
	fs.collection("users").doc(user.uid).get().then((doc) => {
		if (doc.exists) {
			populate_contact_list(user.uid);
		}
	});
	display_logged_in_ui();
	check_friend_requests();
	add_groups_to_grouplists();
}

function check_friend_requests() {
	const user_id = firebase.auth().currentUser.uid;
	const query = fs.collection("accepted-friends")
		.where("uids", "array-contains", user_id);
	query.get().then((snp) => {
		snp.forEach((doc) => {
			fs.collection("friendlists").doc(user_id).get().then((frl) => {
				let found = false;
				if (frl.exists) {
					for (const d of frl.data().uid)
						if (d == doc.id) found = true;
				}
				if (!found) {
					// Become friends
					fs.collection("friendlists").doc(user_id).set({
						uid: firebase.firestore.FieldValue.arrayUnion(doc.id)
					}, { merge: true });
					requestAnimationFrame(add_groups_to_grouplists);
				}
			});
		});
	});
}

function add_groups_to_grouplists() {
	const user_id = firebase.auth().currentUser.uid;
	fs.collection("groups").where("members", "array-contains", user_id)
		.onSnapshot((snp) => {
			snp.forEach(grp => {
				fs.collection("grouplists").doc(user_id).get().then((doc) => {
					let found = false;
					// See if the group is already in the grouplist
					if (doc.exists)
						for (const stored of doc.data().groups)
							if (stored.id == grp.id)
								found = true;
					if (!found && grp.data().admins != null)
						fs.collection("grouplists").doc(user_id).set({

							groups: firebase.firestore.FieldValue
								.arrayUnion({
									id: grp.id,
									name: grp.data().name
								})
						}, { merge: true }).then(() =>
							populate_contact_list(user_id));
					else if (!found) {
						// An automatically created non-modifiable group
						let friend = undefined;
						for (const m of grp.data().members) {
							if (m != user_id) friend = m;
						}
						fs.collection("users").doc(friend).get().then((frn) => {
							const name = frn.data().display;
							fs.collection("grouplists").doc(user_id).set({
								groups: firebase.firestore.FieldValue
									.arrayUnion({
										id: grp.id,
										name: name
									})
							}, { merge: true }).then(() =>
								populate_contact_list(user_id));
						});
					}
				});
			});
		});
}

function populate_contact_list(user_id) {
	const contact_container = document.getElementById("contact-list");
	fs.collection("grouplists").doc(user_id).get().then((doc) => {
		if (!doc.exists)
			return;
		// todo: make a screen telling the user that he has no friends
		contact_container.innerHTML = "";
		let i = 0;
		for (const group of doc.data().groups) {
			fs.collection("groups").doc(group.id).get().then((grp) => {
				contact_container.innerHTML +=
					`<div class="contact ripple active">
						<img class="contact-image" alt="Profile picture"/>
						<section class="contact-text">
							<div class="contact-name"></div>
							<div class="contact-last-message">Hej feto</div>
						</section>
					</div>`;
				contact_container.getElementsByClassName("contact")[i]
					.setAttribute("data-id", group.id);
				contact_container.getElementsByClassName("contact-name")[i]
					.innerText = grp.data().name == null ? group.name
						: grp.data().name;
				contact_container.getElementsByClassName("contact-image")[i]
					.src = grp.data().image;
				contact_container
					.getElementsByClassName("contact-last-message")[i]
					.innerText = grp.data().last_message;
				requestAnimationFrame(() => display_chat());
				i++;
			});
		}
	});
}

function display_logged_in_ui() {
	fade_out_title();
	hide_login_form();
	window.setTimeout(() => {
		display_chat();
		login.style.display = "none";
	}, 250);
	window.setTimeout(() => {
		document.getElementById("bottom-navigation").classList.add("slide-in")
	}, 480);
}

function display_sign_in() {
	document.getElementById("authentication").classList.toggle("float-up");
}

function move_app_title() {
	// Not used anymore since title is removed after loading finishes
	const title = document.getElementById("app-title");
	title.parentNode.removeChild(title);
	document.getElementsByTagName("main")[0].prepend(title);
}

function validate_login_form(form) {
	"use strict";
	const inputs = form.getElementsByTagName("input");
	let valid = true;
	let values = [];
	for (const input of inputs) {
		if (input.validity.valid) {
			values.push(input.value);
		} else {
			valid = false;
		}
	};
	// Return false if form is invalid, else return form values
	return valid ? values : valid;
}


function set_text_color() {
	// Display the fonts initally hidden
	document.body.parentNode.style.color = "rgba(0, 0, 0, 0.9)";
}

function display_snackbar(message) {
	const snackbar = document.createElement("div");
	snackbar.classList.add("snackbar");
	snackbar.innerText = message;
	document.body.appendChild(snackbar);
	requestAnimationFrame(() =>
		requestAnimationFrame(() => {
			snackbar.classList.add("slideUp");
			window.setTimeout(() => {
				snackbar.classList.remove("slideUp");
				window.setTimeout(() => {
					snackbar.parentNode.removeChild(snackbar);
				}, 225);
			}, 3500);
		})
	);
}

function display_loader_in_form(form) {
	window.setTimeout(() => {
		form.parentNode.innerHTML += `<div class="preloader-wrapper active centered">
						<div class="spinner-layer">
							<div class="circle-clipper left">
								<div class="circle"></div>
							</div>
							<div class="gap-patch">
								<div class="circle"></div>
							</div>
							<div class="circle-clipper right">
								<div class="circle"></div>
							</div>
						</div>
					</div>`;
	}, 375);
}

function submit_signup_form(event) {
	const form = document.getElementById("signup");
	const form_vailidation = validate_login_form(form);
	if (form_vailidation === false) {
		display_snackbar("Your form values are incorrectly formated.");
	} else {
		const email = form_vailidation[0];
		const password = form_vailidation[1];
		const display_name = form_vailidation[2];
		// Form was valid
		firebase.auth().createUserWithEmailAndPassword(email, password)
			.then(() => {
				const user = firebase.auth().currentUser;
				const user_id = user.uid;
				user.updateProfile({
					displayName: display_name,
					photoURL: "/images/android-icon-48x48.png"
				});
				fs.collection("users").doc(user_id).set({
					display: display_name,
					image: "/images/android-icon-48x48.png",
				})
			}).catch((error) => {
				if (!error.code == "auth/email-already-in-use")
					console.log(error.code);
				display_snackbar(error.message);
			});
	}
	return false;
}

function submit_login_form(event) {
	const form = document.getElementById("login");
	const form_vailidation = validate_login_form(form);
	if (form_vailidation === false) {
		display_snackbar("Your email or password format is wrong.");
	} else {
		const email = form_vailidation[0];
		const password = form_vailidation[1];
		firebase.auth().signInWithEmailAndPassword(email, password)
			.catch(function (error) {
				display_snackbar(error.message);
			});
	}
	return false;
}
