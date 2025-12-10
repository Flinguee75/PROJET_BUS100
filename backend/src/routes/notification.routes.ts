/**
 * Routes pour les notifications
 * Gère l'enregistrement des tokens FCM et la récupération des notifications
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import notificationService from '../services/notification.service';

const router = Router();

// Schéma de validation pour l'enregistrement d'un token FCM
const registerTokenSchema = z.object({
  userId: z.string().min(1, 'userId est requis'),
  token: z.string().min(1, 'token est requis'),
  platform: z.enum(['ios', 'android', 'web'], {
    errorMap: () => ({ message: 'platform doit être ios, android ou web' }),
  }),
});

// Schéma de validation pour la suppression d'un token FCM
const removeTokenSchema = z.object({
  token: z.string().min(1, 'token est requis'),
});

// Schéma de validation pour marquer une notification comme lue
const markReadSchema = z.object({
  userId: z.string().min(1, 'userId est requis'),
});

/**
 * POST /notifications/fcm/register
 * Enregistre un token FCM pour un utilisateur
 */
router.post('/fcm/register', async (req: Request, res: Response) => {
  try {
    const validatedData = registerTokenSchema.parse(req.body);

    await notificationService.registerFCMToken(
      validatedData.userId,
      validatedData.token,
      validatedData.platform
    );

    res.status(200).json({
      success: true,
      message: 'Token FCM enregistré avec succès',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: error.errors,
      });
      return;
    }

    console.error("Erreur lors de l'enregistrement du token FCM:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'enregistrement du token FCM",
    });
  }
});

/**
 * DELETE /notifications/fcm/remove
 * Supprime un token FCM (déconnexion)
 */
router.delete('/fcm/remove', async (req: Request, res: Response) => {
  try {
    const validatedData = removeTokenSchema.parse(req.body);

    await notificationService.removeFCMToken(validatedData.token);

    res.status(200).json({
      success: true,
      message: 'Token FCM supprimé avec succès',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: error.errors,
      });
      return;
    }

    console.error('Erreur lors de la suppression du token FCM:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du token FCM',
    });
  }
});

/**
 * GET /notifications/user/:userId
 * Récupère les notifications pour un utilisateur
 */
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    if (!userId) {
      res.status(400).json({ success: false, message: 'userId est requis' });
      return;
    }
    const limit = parseInt(req.query.limit as string) || 50;

    const notifications = await notificationService.getNotificationsForUser(userId, limit);

    res.status(200).json({
      success: true,
      data: notifications,
      count: notifications.length,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des notifications',
    });
  }
});

/**
 * GET /notifications/user/:userId/unread-count
 * Compte les notifications non lues pour un utilisateur
 */
router.get('/user/:userId/unread-count', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    if (!userId) {
      res.status(400).json({ success: false, message: 'userId est requis' });
      return;
    }

    const count = await notificationService.getUnreadCount(userId);

    res.status(200).json({
      success: true,
      data: { count },
    });
  } catch (error) {
    console.error('Erreur lors du comptage des notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du comptage des notifications non lues',
    });
  }
});

/**
 * PATCH /notifications/:notificationId/read
 * Marque une notification comme lue
 */
router.patch('/:notificationId/read', async (req: Request, res: Response) => {
  try {
    const notificationId = req.params.notificationId;
    if (!notificationId) {
      res.status(400).json({ success: false, message: 'notificationId est requis' });
      return;
    }
    const validatedData = markReadSchema.parse(req.body);

    await notificationService.markAsRead(notificationId, validatedData.userId);

    res.status(200).json({
      success: true,
      message: 'Notification marquée comme lue',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: error.errors,
      });
      return;
    }

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }
      if (error.message.includes('not a recipient')) {
        res.status(403).json({
          success: false,
          message: error.message,
        });
        return;
      }
    }

    console.error('Erreur lors du marquage de la notification:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du marquage de la notification comme lue',
    });
  }
});

export default router;
