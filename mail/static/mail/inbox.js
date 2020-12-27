document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox')); //loading main inbox
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent')); //loading sent
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive')); //loading archives
  document.querySelector('#compose').addEventListener('click', compose_email); //loading

  // By default, load the inbox
  load_mailbox('inbox');
});

function selectListItem(el){
  // find all the elements in menu and loop over them
  Array.prototype.slice.call(document.querySelectorAll('ul[data-tag="menuList"] li')).forEach(function(element){
    // remove selected class
    element.classList.remove('clicked');
  });
  // add the selected class to the element that was clicked
  el.classList.add('clicked');
  }

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
  
  document.querySelector('#compose-form').onsubmit = function(event) {
    let recipients = document.querySelector('#compose-recipients').value;
    let subject = document.querySelector('#compose-subject').value;
    let body = document.querySelector('#compose-body').value;
    event.preventDefault();
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
      })
    })
    .then(response => response.json())
    .then(result => {
      // Print result
      console.log(result);
    })
    .catch(error => {
      console.log('Error:', error);
    });
    document.querySelector('#compose').classList.remove('clicked');
    setTimeout(() => load_mailbox('sent'), 200);
    document.querySelector('#sent').className = "clicked";
  }  
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = ``;
  
  // Get emails api -> set up mailboxes
    fetch(`/emails/${mailbox}`)
      .then(response => response.json())
      .then(emails => {
        console.log(emails);

        const table = document.createElement('table');
        table.className = 'email-table';
        document.querySelector('#emails-view').append(table);
        const tbody = document.createElement('tbody');
        table.appendChild(tbody);

        if (emails.length === 0) {
          const element = document.createElement('div');
          element.innerHTML = `<p>This mailbox is empty.</p>`;
          document.querySelector('#emails-view').append(element);

        } else {
            emails.forEach(email => {
                // Create general email outer div

                // Create table cell where mark as read button will live
                const readDiv = document.createElement('td');
                readDiv.className = "read-div";
                // Mark as read button/icon
                const markAsReadButton = document.createElement('i');
                markAsReadButton.className = "far fa-envelope-open fa-2x";
                markAsReadButton.id = 'mark-as-read';
                readDiv.insertBefore(markAsReadButton, readDiv.firstChild);
                
                // create general div based on mailbox
                const element = document.createElement('tr');
                element.className = 'email-general-info';
              if (mailbox === 'inbox' || mailbox === 'archive') {
                element.innerHTML = `<td class="email-cell">${email.sender}</td>` + `<td class="email-cell">${email.subject}</td>` + `<td class="email-cell">${email.timestamp}</td>`;
              } else if (mailbox === 'sent') {
                // Grab first name then remaining names as a number to be shown in email div
                if (email.recipients.length > 1) {
                  let recipients = [...email.recipients];
                  let firstUser = recipients.shift();
                  let remainingNames = recipients.length;
                  emails = `${firstUser}+${remainingNames}`; 
                }
                else {
                  emails = email.recipients; 
              } 
                element.innerHTML = `<td class="email-cell">To: ${emails}</td>` + `<td class="email-cell">${email.subject}</td>` + `<td class="email-cell">${email.timestamp}</td>`;
              }
              
                // Put mark as read button in read div, so on and so forth...
                readDiv.insertBefore(markAsReadButton, readDiv.firstChild);

                element.insertBefore(readDiv, element.firstChild);
                
                tbody.appendChild(element);

              // Check to see if read and change background to grey if so, else get number of unread emails to put next to 'inbox' menu item
              if (email.read === true) {
                element.setAttribute("style", "background-color: #e8e8e8;");
                markAsReadButton.setAttribute("className", 'far fa-envelope-open fa-2x');
              }
              else {
                element.setAttribute("style", "background-color: white;")
                markAsReadButton.className = 'fas fa-envelope fa-2x';
                let emailsCopy = [...emails];
                let unreadEmails = [];
                for (let email of emailsCopy) {
                  if (email.read === false) {
                    unreadEmails.push(email);
                  }
                  let unreadCount = unreadEmails.length;
                  if (unreadCount > 0) {
                    document.querySelector('#inbox-label').innerHTML = `Inbox` + ` (${unreadCount})`;
                  }
                  else if (unreadCount === 0){
                    document.querySelector('#inbox-label').innerHTML = `Inbox`;
                  }
                }
              }

                //mark emails as read or unread without opening them.
                markAsReadButton.onclick = () => {
                  if (email.read === true && markAsReadButton.className === 'far fa-envelope-open fa-2x') {
                    markAsReadButton.className = 'fas fa-envelope fa-2x';
                    element.setAttribute("style", "background-color: none");
                    fetch(`/emails/${email.id}`, {
                      method: 'PUT',
                      body: JSON.stringify({
                        read: false
                      })
                    })
                  } else {
                    markAsReadButton.className = 'far fa-envelope-open fa-2x';
                    element.setAttribute("style", "background-color: #e8e8e8");
                    fetch(`/emails/${email.id}`, {
                      method: 'PUT',
                      body: JSON.stringify({
                        read: true
                      })
                    })
                  }
              };

              //get tds that dont have mark as read icon and assign openEmail as click event

              let tds = document.querySelectorAll(".email-general-info > td:not(.read-div)");
              // push tds to arrays
              let tdArr = [];
              for (let td of tds) {
                tdArr.push(td);
              }
              // get only last 3 tds in arrays
              let finalTds = [];
              if (tdArr.length > 3) {
                finalTds = tdArr.slice(1).slice(-3);
              } else {
                finalTds = tdArr;
              }
              // add event listener
              for (let td of finalTds) {
                td.addEventListener('click', () => openEmail(email, mailbox));
              }

              });
            }})
            .catch(error => {
              console.log('Error:', error);
            });
            return false;
          }

          
function openEmail(email, mailbox) {
 const innerElement = document.createElement('div');
  innerElement.className = 'email-spec-info';
  innerElement.innerHTML =
      `<b>To:</b> <p>${email.recipients}</p> <br>` +
      `<b>From:</b> <p>${email.sender}</p> <br>` +
      `<b>Subject:</b> <p>${email.subject}</p> <br>` +
      `<b>Time sent:</b> <p>${email.timestamp}</p> <br>` +
    `<p>${email.body}</p>`;
  
  // Create reply button
  const replyButton = document.createElement('button');
  replyButton.className = 'btn btn-sm btn-primary';
  replyButton.id = 'reply';
  replyButton.innerHTML = 'Reply';

  // Archive 
  const archiveButton = document.createElement('button');
  archiveButton.className = 'btn btn-sm btn-primary';
  archiveButton.id = 'archive';

  if (mailbox === 'archive' && email.archived === true) {
    archiveButton.innerHTML = 'Unarchive';
  } else if (mailbox === 'inbox' && email.archived === false) {
    archiveButton.innerHTML = 'Archive';
  } else {
    archiveButton.style.display = 'none';
  }

// Mark as read
  let div = document.querySelector('.email-cell');
    if (mailbox === 'inbox' || mailbox === 'archived') {
      div.setAttribute("style", "background-color: #e8e8e8;");
      fetch(`/emails/${email.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          read: true
        })
      })
    }

  document.querySelector('#emails-view').append(innerElement, replyButton, archiveButton);
  
  // Hide email list and show only selected email
  
  let elements = document.getElementsByClassName('email-general-info');
  for (let i = 0; i < elements.length; i += 1) {
      elements[i].style.display = 'none';
  }
  // Click events for buttons
  replyButton.addEventListener('click', () => loadReply(email), {once: true});
  archiveButton.addEventListener('click', () => archiveEmail(email));
}

function loadReply(email) {
  document.querySelector('#compose-view').style.display = 'block';

  // get rid of individual email screens
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('.email-spec-info').style.display = 'none';

  // Format subject
  let replySubject = email.subject;
  let replyHeader = 'RE: ';
  if (replySubject.includes(replyHeader)) {
    replyHeader = '';
  }
  let formattedSubject = replyHeader + replySubject;

  document.querySelector('#compose-recipients').value = email.sender;
  document.querySelector('#compose-subject').value =  formattedSubject;
  document.querySelector('#compose-body').value = `\n \nOn ${email.timestamp}, ${email.sender} wrote:\n${email.body}`;
  
  document.querySelector('#compose-form').onsubmit = function(event) {
    let recipients = document.querySelector('#compose-recipients').value;
    let subject = formattedSubject;
    let body = document.querySelector('#compose-body').value;
    event.preventDefault();
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
      })
    })
      .then(response => response.json())
      .then(result => {
        // Print result
        console.log(result);
      });
      //remove click class from inbox menu, reload sent mailbox, add click class to sent menu
      document.querySelector('#inbox').classList.remove('clicked');
      setTimeout(() => load_mailbox('sent'), 200);
      document.querySelector('#sent').className = "clicked";
  }
  }

function archiveEmail(email) {
  let archiveButton = document.getElementById('archive');
  if (email.archived === false && archiveButton.innerHTML === 'Archive') {
    archiveButton.innerHTML = 'Unarchive'
    fetch(`/emails/${email.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        archived: true
      })
    })
    
  } else {
    archiveButton.innerHTML = 'Archive';
    fetch(`/emails/${email.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        archived: false
      })
    })
  }
  // remove click class from arhcive menu, reload inbox, add click class back to inbox menu
  document.querySelector('#archived').classList.remove('clicked');
  setTimeout(() => load_mailbox('inbox'), 500);
  document.querySelector('#inbox').className = "clicked";
}