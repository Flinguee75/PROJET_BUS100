import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Bus, Clock, MapPin, Users, type LucideIcon } from 'lucide-react';
import {
  CourseHistoryEntry,
  watchRecentCourseHistory,
} from '@/services/courseHistory.firestore';
import { getStudentsByIds, type Student } from '@/services/students.firestore';

interface CourseStudentDetails {
  scanned: Student[];
  missed: Student[];
}

export const CourseHistoryPage = () => {
  const [courses, setCourses] = useState<CourseHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, CourseStudentDetails>>({});
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoneFilter, setZoneFilter] = useState<string>('');
  const [tripFilter, setTripFilter] = useState<string>('');
  const [busFilter, setBusFilter] = useState<string>('');

  useEffect(() => {
    const unsubscribe = watchRecentCourseHistory(
      25,
      (entries) => {
        setCourses(entries);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const course = courses.find((c) => c.id === expandedId);
    if (!course || details[course.id]) {
      return;
    }

    const fetchDetails = async () => {
      setDetailsLoading(true);
      try {
        const [scanned, missed] = await Promise.all([
          getStudentsByIds(course.scannedStudentIds || []),
          getStudentsByIds(course.missedStudentIds || []),
        ]);
        setDetails((prev) => ({
          ...prev,
          [course.id]: {
            scanned,
            missed,
          },
        }));
      } catch (err) {
        console.error('❌ Erreur chargement détails course:', err);
      } finally {
        setDetailsLoading(false);
      }
    };

    if (course.scannedStudentIds.length || course.missedStudentIds.length) {
      fetchDetails();
    } else {
      setDetails((prev) => ({
        ...prev,
        [course.id]: { scanned: [], missed: [] },
      }));
    }
  }, [courses, details, expandedId]);

  const zoneOptions = useMemo(() => {
    const zones = new Set<string>();
    courses.forEach((course) => {
      if (course.zoneLabel) {
        zones.add(course.zoneLabel);
      }
    });
    return Array.from(zones).sort((a, b) => a.localeCompare(b));
  }, [courses]);

  const busOptions = useMemo(() => {
    const buses = new Set<string>();
    courses.forEach((course) => {
      if (course.busLabel) {
        buses.add(course.busLabel);
      } else if (course.busId) {
        buses.add(course.busId);
      }
    });
    return Array.from(buses).sort((a, b) => a.localeCompare(b));
  }, [courses]);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      if (zoneFilter && course.zoneLabel !== zoneFilter) {
        return false;
      }
      if (tripFilter && course.tripType !== tripFilter) {
        return false;
      }
      if (busFilter && (course.busLabel !== busFilter && course.busId !== busFilter)) {
        return false;
      }
      return true;
    });
  }, [courses, zoneFilter, tripFilter, busFilter]);

  useEffect(() => {
    if (expandedId && !filteredCourses.some((course) => course.id === expandedId)) {
      setExpandedId(null);
    }
  }, [filteredCourses, expandedId]);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Historique des courses</h1>
        <p className="text-sm text-slate-500">Consultez les dernières courses enregistrées par les chauffeurs.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Zone</label>
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            >
              <option value="">Toutes les zones</option>
              {zoneOptions.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Période</label>
            <select
              value={tripFilter}
              onChange={(e) => setTripFilter(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            >
              <option value="">Toutes les périodes</option>
              <option value="morning_outbound">Matin - Récupérer les élèves</option>
              <option value="midday_outbound">Midi - Déposer les élèves</option>
              <option value="midday_return">Après-midi - Récupérer les élèves</option>
              <option value="evening_return">Soir - Déposer les élèves</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Bus</label>
            <select
              value={busFilter}
              onChange={(e) => setBusFilter(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            >
              <option value="">Tous les bus</option>
              {busOptions.map((bus) => (
                <option key={bus} value={bus}>
                  {bus}
                </option>
              ))}
            </select>
          </div>
        </div>
        {(zoneFilter || tripFilter || busFilter) && (
          <div className="mt-4 text-right">
            <button
              type="button"
              onClick={() => {
                setZoneFilter('');
                setTripFilter('');
                setBusFilter('');
              }}
              className="text-sm font-semibold text-slate-500 hover:text-slate-700"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            Chargement de l'historique...
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            {courses.length === 0 ? 'Aucune course enregistrée pour le moment.' : 'Aucune course ne correspond aux filtres.'}
          </div>
        ) : (
          filteredCourses.map((course) => {
            const isExpanded = expandedId === course.id;
            const courseDetails = details[course.id];

            return (
              <div
                key={course.id}
                className={`rounded-2xl border transition-all duration-200 shadow-sm ${isExpanded ? 'border-primary-500 bg-primary-50' : 'border-slate-200 bg-white'}`}
              >
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center">
                        <Bus className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {course.busLabel || `Bus ${course.busId}`}
                        </p>
                        <p className="text-xs text-slate-500">
                          {course.tripLabel || course.tripType || 'Course'} · {course.driverName || 'Chauffeur inconnu'}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500">{formatDate(course.startTime)}</div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <InfoStat icon={MapPin} label="Zone" value={course.zoneLabel || '—'} />
                    <InfoStat icon={Clock} label="Durée" value={formatDuration(course.durationMinutes)} />
                    <InfoStat
                      icon={Users}
                      label="Présents"
                      value={`${course.stats.scannedCount ?? 0}/${course.stats.totalStudents ?? '—'}`}
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : course.id)}
                      className="text-sm font-semibold text-primary-600 hover:text-primary-700"
                    >
                      {isExpanded ? 'Masquer les détails' : 'Voir les détails'}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-200 bg-white rounded-b-2xl p-6">
                    <CourseDetail
                      course={course}
                      studentDetails={courseDetails}
                      loading={detailsLoading && !courseDetails}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const InfoStat = ({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) => (
  <div className="rounded-xl bg-slate-50 px-3 py-2">
    <div className="text-[11px] uppercase tracking-wide text-slate-400">{label}</div>
    <div className="flex items-center space-x-2 text-slate-800 font-semibold">
      <Icon className="w-4 h-4 text-slate-400" />
      <span>{value}</span>
    </div>
  </div>
);

const CourseDetail = ({
  course,
  studentDetails,
  loading,
}: {
  course: CourseHistoryEntry;
  studentDetails?: CourseStudentDetails;
  loading: boolean;
}) => {
  const stats = course.stats;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{course.busLabel || course.busId}</h2>
        <p className="text-sm text-slate-500">
          {course.tripLabel || course.tripType} · {course.driverName || 'Chauffeur'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-slate-500">Heure de départ</p>
          <p className="font-semibold text-slate-900">{formatDateTime(course.startTime)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Heure de fin</p>
          <p className="font-semibold text-slate-900">{formatDateTime(course.endTime)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Durée</p>
          <p className="font-semibold text-slate-900">{formatDuration(course.durationMinutes)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Zone</p>
          <p className="font-semibold text-slate-900">{course.zoneLabel || '—'}</p>
        </div>
      </div>

      <div className="rounded-xl bg-slate-50 p-4 grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-xs text-slate-500">Total</p>
          <p className="text-xl font-semibold text-slate-900">{stats.totalStudents ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Présents</p>
          <p className="text-xl font-semibold text-green-600">{stats.scannedCount ?? 0}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Absents</p>
          <p className="text-xl font-semibold text-red-500">{stats.unscannedCount ?? 0}</p>
        </div>
      </div>

      {loading && (
        <p className="text-sm text-slate-500">Chargement des élèves...</p>
      )}

      {studentDetails && (
        <div className="space-y-4">
          <StudentList title="Élèves présents" students={studentDetails.scanned} emptyLabel="Aucun élève enregistré" />
          <StudentList title="Élèves absents" students={studentDetails.missed} emptyLabel="Tous les élèves étaient présents" />
        </div>
      )}
    </div>
  );
};

const StudentList = ({
  title,
  students,
  emptyLabel,
}: {
  title: string;
  students: Student[];
  emptyLabel: string;
}) => (
  <div>
    <p className="text-sm font-semibold text-slate-900 mb-2">{title}</p>
    {students.length === 0 ? (
      <p className="text-sm text-slate-500">{emptyLabel}</p>
    ) : (
      <ul className="space-y-2">
        {students.map((student) => (
          <li key={student.id} className="flex items-center space-x-3">
            {student.photoUrl ? (
              <img
                src={student.photoUrl}
                alt={`${student.firstName} ${student.lastName}`}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-semibold">
                {student.firstName.slice(0, 1)}
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-slate-900">
                {student.firstName} {student.lastName}
              </p>
              <p className="text-xs text-slate-500">{student.grade || 'Classe inconnue'}</p>
            </div>
          </li>
        ))}
      </ul>
    )}
  </div>
);

function formatDate(timestamp: number | null): string {
  if (!timestamp) {
    return '—';
  }
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatDateTime(timestamp: number | null): string {
  if (!timestamp) {
    return '—';
  }
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatDuration(durationMinutes: number | null): string {
  if (!durationMinutes) {
    return '—';
  }
  if (durationMinutes < 60) {
    return `${durationMinutes} min`;
  }
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  return `${hours}h${minutes.toString().padStart(2, '0')}`;
}
