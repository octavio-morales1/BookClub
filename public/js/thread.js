

import * as discussionAPI from '../../data/discussions.js'

const createThreadForm = document.getElementById('createThreadForm');

createThreadForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const discussionId = document.getElementById('discussionId').value;
    const userId = document.getElementById('userId').value;
    const content = document.getElementById('content').value;

    try {
    const thread = await discussionAPI.createThread(discussionId, userId, content);
    window.location.reload();
    } catch (error) {
        console.error('Error creating thread:', error);
    }
});
