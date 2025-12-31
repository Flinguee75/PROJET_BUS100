/**
 * UrgencySection - Section d'alerte dynamique (Management by Exception)
 * Affiche les courses terminées avec élèves manquants
 * Permet de supprimer les urgences déjà traitées
 */

import { AlertTriangle, X, Bus } from 'lucide-react';
import type { CourseHistory } from '@/services/courseHistory.firestore';

interface UrgencySectionProps {
  courses: CourseHistory[];
  delayedBusCount: number;
  onDismissCourse: (courseId: string) => void;
  onBusClick?: (busId: string) => void;
}

export const UrgencySection: React.FC<UrgencySectionProps> = ({
  courses,
  delayedBusCount,
  onDismissCourse,
  onBusClick,
}) => {
  const totalMissedStudents = courses.reduce(
    (total, course) => total + (course.stats?.unscannedCount ?? course.missedStudentIds?.length ?? 0),
    0
  );

  // Ne rien afficher si aucune urgence
  if (totalMissedStudents === 0 && delayedBusCount === 0) {
    return null;
  }

  return (
    <div
      className="bg-red-50 border-l-4 border-red-600 p-4 mb-4"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-5 h-5 text-red-600" strokeWidth={2.5} aria-hidden="true" />
        <h3 className="text-sm font-bold text-red-900">
          Urgences
        </h3>
        <span className="ml-auto px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded-full">
          {totalMissedStudents}
        </span>
      </div>

      {totalMissedStudents > 0 && (
        <div className="space-y-2">
          {courses.map((course) => {
            const missedCount = course.stats?.unscannedCount ?? course.missedStudentIds?.length ?? 0;
            if (missedCount === 0) return null;

            return (
              <div
                key={course.id}
                className="bg-white rounded-lg p-3 border border-red-200"
              >
                <div className="flex items-center justify-between">
                  <div
                    className="flex items-center gap-2 flex-1 cursor-pointer"
                    onClick={() => onBusClick?.(course.busId)}
                  >
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <Bus className="w-4 h-4 text-red-700" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">
                        Bus {course.busNumber || course.busId}
                      </p>
                      <p className="text-xs text-red-600 font-medium">
                        {missedCount} élève{missedCount > 1 ? 's' : ''} manquant{missedCount > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onDismissCourse(course.id)}
                    className="p-1 hover:bg-red-100 rounded transition-colors"
                    aria-label="Marquer comme traité"
                    title="Supprimer cette urgence"
                  >
                    <X className="w-4 h-4 text-red-700" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {delayedBusCount > 0 && (
        <p className="text-xs text-red-700 mt-2">
          {delayedBusCount} bus en retard
        </p>
      )}
    </div>
  );
};
