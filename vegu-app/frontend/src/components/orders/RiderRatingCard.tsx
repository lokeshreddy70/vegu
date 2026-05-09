'use client';

import { useState, useEffect } from 'react';
import { Star, Heart } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Props {
  orderId: string;
  deliveryPartnerId: string;
  riderName?: string;
}

const TRUST_BADGE_COLORS: Record<string, string> = {
  Elite:    'bg-purple-100 text-purple-700',
  Trusted:  'bg-blue-100 text-blue-700',
  Reliable: 'bg-emerald-100 text-emerald-700',
  Rookie:   'bg-gray-100 text-gray-600',
};

export default function RiderRatingCard({ orderId, deliveryPartnerId, riderName }: Props) {
  const [selectedRating, setSelectedRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [riderProfile, setRiderProfile] = useState<{
    rating: number; totalDeliveries: number;
    badge: { label: string; tier: number };
  } | null>(null);

  useEffect(() => {
    // Check if already rated
    api.get(`/api/trusted-riders/rate-status/${orderId}`)
      .then(r => { if (r.data.data?.rated) setSubmitted(true); })
      .catch(() => {});

    // Fetch rider public profile
    api.get(`/api/trusted-riders/profile/${deliveryPartnerId}`)
      .then(r => setRiderProfile(r.data.data))
      .catch(() => {});
  }, [orderId, deliveryPartnerId]);

  const handleSubmit = async () => {
    if (!selectedRating || submitting) return;
    setSubmitting(true);
    try {
      await api.post(`/api/trusted-riders/rate/${orderId}`, { rating: selectedRating, comment: comment || undefined });
      setSubmitted(true);
      toast.success('Thanks for your feedback!', { style: { background: '#fff', color: '#1A1A1A', border: '1px solid #E8E8E8' } });
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Could not submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFavorite = async () => {
    try {
      const res = await api.post(`/api/trusted-riders/favorites/toggle/${deliveryPartnerId}`);
      const isFav = res.data.data?.favorited;
      setFavorited(isFav);
      toast.success(isFav ? 'Added to favorite riders' : 'Removed from favorites', {
        style: { background: '#fff', color: '#1A1A1A', border: '1px solid #E8E8E8' },
      });
    } catch {}
  };

  const badgeLabel = riderProfile?.badge?.label ?? 'Rider';
  const badgeCls = TRUST_BADGE_COLORS[badgeLabel] ?? TRUST_BADGE_COLORS.Rookie;

  if (submitted) {
    return (
      <div className="mx-4 mb-4 bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
          </div>
          <div>
            <p className="text-gray-800 font-semibold text-sm">Delivery rated!</p>
            <p className="text-gray-400 text-xs">Your feedback helps improve the service</p>
          </div>
        </div>
        <button type="button" onClick={handleFavorite}
          className={`w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold border transition-all ${
            favorited
              ? 'bg-red-50 border-red-100 text-red-500'
              : 'bg-gray-50 border-gray-100 text-gray-600 hover:bg-red-50 hover:border-red-100 hover:text-red-500'
          }`}>
          <Heart className={`w-4 h-4 ${favorited ? 'fill-red-500' : ''}`} />
          {favorited ? 'Saved as favorite rider' : 'Save as favorite rider'}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-4 mb-4 bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-gray-900 font-bold text-sm">Rate your delivery</p>
          {riderName && <p className="text-gray-400 text-xs mt-0.5">How was {riderName.split(' ')[0]}&apos;s service?</p>}
        </div>
        {riderProfile && (
          <div className="text-right">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeCls}`}>{badgeLabel}</span>
            <p className="text-gray-400 text-[10px] mt-0.5">{riderProfile.totalDeliveries} deliveries</p>
          </div>
        )}
      </div>

      {/* Star rating */}
      <div className="flex gap-2 justify-center mb-4">
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} type="button"
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setSelectedRating(n)}
            className="transition-transform active:scale-110">
            <Star
              className={`w-9 h-9 transition-colors ${
                n <= (hovered || selectedRating)
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-gray-200 fill-gray-100'
              }`}
            />
          </button>
        ))}
      </div>

      {selectedRating > 0 && (
        <p className="text-center text-sm font-semibold text-gray-700 -mt-2 mb-3">
          {['', 'Poor 😞', 'Fair 😐', 'Good 🙂', 'Great 😊', 'Excellent 🌟'][selectedRating]}
        </p>
      )}

      {/* Optional comment */}
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Leave a comment (optional)…"
        rows={2}
        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm text-gray-700 placeholder:text-gray-300 outline-none focus:ring-2 focus:ring-veg/20 resize-none mb-3"
      />

      <div className="flex gap-2">
        <button type="button" onClick={handleSubmit} disabled={!selectedRating || submitting}
          className="flex-1 bg-veg text-white font-bold py-3 rounded-2xl text-sm disabled:opacity-40 active:scale-[0.98] transition-all">
          {submitting ? 'Submitting…' : 'Submit Rating'}
        </button>
        <button type="button" onClick={handleFavorite}
          className={`w-12 h-12 flex items-center justify-center rounded-2xl border transition-all ${
            favorited ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'
          }`}>
          <Heart className={`w-5 h-5 ${favorited ? 'text-red-500 fill-red-500' : 'text-gray-400'}`} />
        </button>
      </div>
    </div>
  );
}
