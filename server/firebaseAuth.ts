import admin from "firebase-admin";
import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { sendWelcomeEmail } from "./email";

function getPrivateKey(): string {
  let key = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (!key) {
    throw new Error("FIREBASE_ADMIN_PRIVATE_KEY is not set");
  }
  
  key = key.trim();
  
  if (key.startsWith('"') && key.endsWith('"')) {
    key = key.slice(1, -1);
  }
  
  if (key.includes('\\n')) {
    key = key.replace(/\\n/g, '\n');
  }
  
  return key;
}

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: getPrivateKey(),
      }),
    });
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
  }
}

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    name?: string;
    picture?: string;
  };
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
}

async function verifyFirebaseToken(token: string) {
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error("Error verifying Firebase token:", error);
    return null;
  }
}

export async function isAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const token = authHeader.split("Bearer ")[1];
  const decodedToken = await verifyFirebaseToken(token);

  if (!decodedToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  (req as AuthenticatedRequest).user = {
    uid: decodedToken.uid,
    email: decodedToken.email,
    name: decodedToken.name,
    picture: decodedToken.picture,
  };

  next();
}

export async function getUserFromToken(authHeader: string | undefined) {
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split("Bearer ")[1];
  const decodedToken = await verifyFirebaseToken(token);

  if (!decodedToken) {
    return null;
  }

  const firstName = decodedToken.name?.split(" ")[0] || null;
  const email = decodedToken.email || null;

  const { user, isNewUser } = await storage.upsertUser({
    id: decodedToken.uid,
    email,
    firstName,
    lastName: decodedToken.name?.split(" ").slice(1).join(" ") || null,
    profileImageUrl: decodedToken.picture || null,
  });

  if (isNewUser && email) {
    sendWelcomeEmail(email, firstName || "").catch((err) => {
      console.error("Failed to send welcome email:", err);
    });
  }

  return user;
}
