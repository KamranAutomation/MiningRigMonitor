import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { doc, deleteDoc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';

export async function DELETE(req: NextRequest, { params }: { params: { rigId: string } }) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get('uid');
    const rigId = params.rigId;
    if (!uid || !rigId) {
      return NextResponse.json({ error: 'Missing user ID or rig ID' }, { status: 400 });
    }

    // Delete the rig document
    await deleteDoc(doc(db, `users/${uid}/rigs/${rigId}`));

    // Add rig ID to deletedRigs list (create doc if not exists)
    const settingsRef = doc(db, `users/${uid}/settings/deletedRigs`);
    const settingsSnap = await getDoc(settingsRef);
    if (settingsSnap.exists()) {
      await updateDoc(settingsRef, { ids: arrayUnion(rigId.toLowerCase()) });
    } else {
      await setDoc(settingsRef, { ids: [rigId.toLowerCase()] });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to delete rig' }, { status: 500 });
  }
}
