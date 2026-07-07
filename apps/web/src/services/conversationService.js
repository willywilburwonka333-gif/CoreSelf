import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebaseClient';
import { currentCoreUser } from './authService';

export const CURRENT_CONVERSATION_KEY = 'currentConversationId';

function userConversationsRef(uid) {
  return collection(db, 'users', uid, 'conversations');
}

function conversationRef(uid, conversationId) {
  return doc(db, 'users', uid, 'conversations', conversationId);
}

function messagesRef(uid, conversationId) {
  return collection(db, 'users', uid, 'conversations', conversationId, 'messages');
}

export function buildMessage({ from, text, meta = null, at = null }) {
  return {
    from,
    text: String(text || ''),
    meta: meta || null,
    at: at || new Date().toISOString(),
  };
}

export async function ensureConversation(existingConversationId = null, titleSeed = 'Core conversation') {
  const user = currentCoreUser();
  if (!user) return { ok: false, reason: 'No authenticated Core user.' };

  if (existingConversationId) {
    const existing = await getDoc(conversationRef(user.uid, existingConversationId));
    if (existing.exists()) return { ok: true, conversationId: existingConversationId };
  }

  const created = await addDoc(userConversationsRef(user.uid), {
    title: titleSeed.slice(0, 70),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    version: 'Genesis 0.3.0',
  });

  return { ok: true, conversationId: created.id };
}

export async function saveConversationMessage(conversationId, message) {
  const user = currentCoreUser();
  if (!user || !conversationId) return { ok: false, reason: 'No authenticated Core user or conversation.' };

  const cleanMessage = buildMessage(message);
  await addDoc(messagesRef(user.uid, conversationId), {
    ...cleanMessage,
    createdAt: serverTimestamp(),
  });

  await updateDoc(conversationRef(user.uid, conversationId), {
    updatedAt: serverTimestamp(),
    lastMessage: cleanMessage.text.slice(0, 180),
    lastFrom: cleanMessage.from,
  }).catch(async () => {
    await setDoc(conversationRef(user.uid, conversationId), {
      title: cleanMessage.text.slice(0, 70) || 'Core conversation',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessage: cleanMessage.text.slice(0, 180),
      lastFrom: cleanMessage.from,
      version: 'Genesis 0.3.0',
    }, { merge: true });
  });

  return { ok: true };
}

export async function loadLatestConversationMessages(conversationId, fallback = []) {
  const user = currentCoreUser();
  if (!user || !conversationId) return { ok: false, messages: fallback, reason: 'No authenticated Core user or conversation.' };

  const snap = await getDocs(query(messagesRef(user.uid, conversationId), orderBy('createdAt', 'asc'), limit(80)));
  const messages = snap.docs.map((item) => {
    const data = item.data();
    return buildMessage({
      from: data.from,
      text: data.text,
      meta: data.meta || null,
      at: data.at || data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
    });
  });

  return { ok: true, messages: messages.length ? messages : fallback };
}

export async function listConversations() {
  const user = currentCoreUser();
  if (!user) return { ok: false, conversations: [], reason: 'No authenticated Core user.' };

  const snap = await getDocs(query(userConversationsRef(user.uid), orderBy('updatedAt', 'desc'), limit(20)));
  return {
    ok: true,
    conversations: snap.docs.map((item) => ({ id: item.id, ...item.data() })),
  };
}
