// ============================================================
// HEARTIX STAFF ACTIVITY — Logging helper + lastLogin tracker
// ============================================================
import { db, auth } from './firebase.js';
import {
    collection, addDoc, serverTimestamp, doc, getDoc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Cache staff profile so we don't refetch every log
let cachedProfile = null;
let loginRecorded = false;

async function getCurrentUserProfile() {
    if (cachedProfile) return cachedProfile;
    const user = auth.currentUser;
    if (!user) return null;
    try {
        const snap = await getDoc(doc(db, "staff", user.uid));
        if (snap.exists()) {
            const d = snap.data();
            cachedProfile = {
                uid: user.uid,
                name: d.name || user.displayName || user.email || 'Unknown',
                email: d.email || user.email || '',
                role: d.role || 'staff'
            };
            return cachedProfile;
        }
    } catch (e) {
        console.warn('Profile fetch for activity failed:', e);
    }
    cachedProfile = {
        uid: user.uid,
        name: user.displayName || user.email || 'Unknown',
        email: user.email || '',
        role: 'staff'
    };
    return cachedProfile;
}

/**
 * Log an activity to the activity_log collection.
 *
 * @param {string} action  — short action key (e.g. 'login', 'order_status', 'product_add')
 * @param {object} details — { description: 'human readable', meta: {...} }
 */
export async function logActivity(action, details = {}) {
    try {
        const profile = await getCurrentUserProfile();
        if (!profile) return;

        await addDoc(collection(db, "activity_log"), {
            uid: profile.uid,
            name: profile.name,
            email: profile.email,
            role: profile.role,
            action: action,
            description: details.description || '',
            meta: details.meta || {},
            createdAt: serverTimestamp()
        });

        // On login, also update staff doc's lastLogin (only once per session)
        if (action === 'login' && !loginRecorded) {
            loginRecorded = true;
            try {
                await updateDoc(doc(db, "staff", profile.uid), {
                    lastLogin: serverTimestamp()
                });
            } catch (e) {
                console.warn('lastLogin update failed:', e);
            }
        }
    } catch (e) {
        console.warn('Activity log failed:', e);
    }
}

/**
 * Reset cached profile (call after logout or profile update)
 */
export function resetActivityProfileCache() {
    cachedProfile = null;
    loginRecorded = false;
}

// Expose to window for non-module scripts
if (typeof window !== 'undefined') {
    window.logActivity = logActivity;
    window.resetActivityProfileCache = resetActivityProfileCache;
}

console.log('✅ staff-activity.js loaded (with lastLogin tracker)');