// Everyone Page. Celebrations + announcements + questions visible to all roles.
// Per the council's decision: guides post directly; learners post with a
// "pending" status until a guide reviews and approves. Parents can read but
// not submit (in the skeleton).
//
// Visibility rules:
//   - Published posts: everyone sees them
//   - Pending posts: visible to the author + all guides (so guides can review)
//   - Rejected posts: visible to the author only (to soften the rejection)

import { getPosts, addPost, getSession } from './store.js';
import { openPostModal } from './modals.js';

const KIND_LABEL = {
  celebration: 'Celebration',
  announcement: 'Announcement',
  question: 'Question',
};

export function renderEveryone() {
  const list = document.getElementById('everyone-list');
  const fab = document.getElementById('everyone-add');
  const session = getSession();

  // Learners and guides can post. Parents read only (skeleton scope).
  if (session && (session.role === 'guide' || session.role === 'learner')) {
    fab.style.display = 'block';
  } else {
    fab.style.display = 'none';
  }

  const all = getPosts();
  const visible = filterPostsForViewer(all, session);

  if (visible.length === 0) {
    list.innerHTML = '<p class="everyone-empty">No posts yet. Share a celebration, an announcement, or ask for help.</p>';
    return;
  }

  list.innerHTML = '';
  visible.forEach((post) => list.appendChild(renderPostCard(post, session)));
}

function filterPostsForViewer(posts, session) {
  if (!session) return [];
  return posts.filter((p) => {
    const status = p.status || 'published';
    if (status === 'published') return true;
    if (status === 'pending') {
      // Visible to the author or to any guide for review
      if (session.role === 'guide') return true;
      if (p.authorName === session.name) return true;
      return false;
    }
    if (status === 'rejected') {
      // Author-only - softer than a public rejection
      return p.authorName === session.name;
    }
    return false;
  });
}

function renderPostCard(post, session) {
  const el = document.createElement('div');
  const status = post.status || 'published';
  el.className = 'everyone-post' + (status !== 'published' ? ` everyone-post-${status}` : '');
  const isGuide = session?.role === 'guide';
  const reviewActions = (status === 'pending' && isGuide)
    ? `<div class="post-review-actions">
         <button type="button" class="btn btn-text post-approve" data-id="${post.id}">Approve</button>
         <button type="button" class="btn btn-text post-reject" data-id="${post.id}">Reject</button>
       </div>`
    : '';
  const statusBadge = status === 'pending'
    ? '<span class="post-status post-status-pending">Pending review</span>'
    : status === 'rejected'
      ? '<span class="post-status post-status-rejected">Not approved</span>'
      : '';
  const kind = post.kind || 'celebration';
  el.innerHTML = `
    <div class="post-meta">
      <span>
        ${escapeHtml(post.authorName || post.authorRole)}
        <span class="post-kind post-kind-${kind}">${KIND_LABEL[kind] || 'Post'}</span>
        ${statusBadge}
      </span>
      <span>${formatDate(post.createdAt)}</span>
    </div>
    <p class="post-body">${escapeHtml(post.body)}</p>
    ${reviewActions}
  `;

  // Wire approve/reject if visible
  el.querySelector('.post-approve')?.addEventListener('click', () => {
    setPostStatus(post.id, 'published');
    renderEveryone();
  });
  el.querySelector('.post-reject')?.addEventListener('click', () => {
    if (confirm('Reject this post? The author will see it as "Not approved".')) {
      setPostStatus(post.id, 'rejected');
      renderEveryone();
    }
  });

  return el;
}

function setPostStatus(id, status) {
  // Read directly from localStorage to update status. The store's addPost
  // doesn't have an update path yet; we do a minimal mutation here.
  const raw = localStorage.getItem('hc_everyone_posts');
  const posts = raw ? JSON.parse(raw) : [];
  const idx = posts.findIndex((p) => p.id === id);
  if (idx >= 0) {
    posts[idx].status = status;
    posts[idx].reviewedAt = new Date().toISOString();
    localStorage.setItem('hc_everyone_posts', JSON.stringify(posts));
  }
}

export function initEveryone() {
  const fab = document.getElementById('everyone-add');
  if (!fab) return;
  // Replace any prior listener
  const fresh = fab.cloneNode(true);
  fab.parentNode.replaceChild(fresh, fab);
  fresh.addEventListener('click', () => {
    const session = getSession();
    if (!session) return;
    openPostModal({
      role: session.role,
      onSave: ({ body, kind }) => {
        const status = session.role === 'guide' ? 'published' : 'pending';
        addPost({
          body,
          kind,
          authorRole: session.role,
          authorName: session.name || session.role,
          status,
        });
        renderEveryone();
      },
    });
  });
}

function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
