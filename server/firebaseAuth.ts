import admin from "firebase-admin";
import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      clientEmail: `firebase-adminsdk-fbsvc@${process.env.VITE_FIREBASE_PROJECT_ID}.iam.gserviceaccount.com`,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
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

  await storage.upsertUser({
    id: decodedToken.uid,
    email: decodedToken.email || null,
    firstName: decodedToken.name?.split(" ")[0] || null,
    lastName: decodedToken.name?.split(" ").slice(1).join(" ") || null,
    profileImageUrl: decodedToken.picture || null,
  });

  return await storage.getUser(decodedToken.uid);
}
