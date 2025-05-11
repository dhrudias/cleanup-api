const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY))
});

const db = admin.firestore();

app.post("/cleanup-room", async (req, res) => {
  const { roomId } = req.body;
  if (!roomId) return res.status(400).json({ error: "Missing roomId" });

  try {
    const roomRef = db.collection("rooms").doc(roomId);

    const deleteSub = async (sub) => {
      const snapshot = await roomRef.collection(sub).get();
      await Promise.all(snapshot.docs.map(doc => doc.ref.delete()));
    };

    await deleteSub("callerCandidates");
    await deleteSub("calleeCandidates");
    await roomRef.delete();

    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Cleanup failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Cleanup API running on ${PORT}`));
