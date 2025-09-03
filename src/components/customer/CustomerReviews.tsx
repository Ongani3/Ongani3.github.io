import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Star, Plus, Search, ThumbsUp, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface CustomerReviewsProps {
  user: User;
}

interface Review {
  id: string;
  order_id: string;
  service_id: string;
  rating: number;
  title: string;
  review_text: string;
  photos: string[];
  is_verified_purchase: boolean;
  is_published: boolean;
  helpful_votes: number;
  total_votes: number;
  store_response: string;
  store_response_date: string;
  created_at: string;
  updated_at: string;
}

export const CustomerReviews: React.FC<CustomerReviewsProps> = ({ user }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewReview, setShowNewReview] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [newReview, setNewReview] = useState({
    order_id: '',
    rating: 5,
    title: '',
    review_text: ''
  });

  useEffect(() => {
    loadReviews();
    loadOrders();
  }, [user]);

  useEffect(() => {
    filterReviews();
  }, [reviews, searchTerm, ratingFilter]);

  const loadReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('customer_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error loading reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, status, created_at')
        .eq('customer_user_id', user.id)
        .eq('status', 'delivered')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const filterReviews = () => {
    let filtered = reviews;

    if (searchTerm) {
      filtered = filtered.filter(review =>
        review.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.review_text?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (ratingFilter !== 'all') {
      filtered = filtered.filter(review => review.rating === parseInt(ratingFilter));
    }

    setFilteredReviews(filtered);
  };

  const submitReview = async () => {
    if (!newReview.order_id || !newReview.title || !newReview.review_text) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      // Get store info from the order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('store_user_id')
        .eq('id', newReview.order_id)
        .single();

      if (orderError) throw orderError;

      const { error } = await supabase
        .from('reviews')
        .insert({
          customer_user_id: user.id,
          store_user_id: orderData.store_user_id,
          order_id: newReview.order_id,
          rating: newReview.rating,
          title: newReview.title,
          review_text: newReview.review_text,
          is_verified_purchase: true,
          is_published: true
        });

      if (error) throw error;

      toast.success('Review submitted successfully');
      setShowNewReview(false);
      setNewReview({
        order_id: '',
        rating: 5,
        title: '',
        review_text: ''
      });
      loadReviews();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    }
  };

  const renderStars = (rating: number, interactive = false, onRatingChange?: (rating: number) => void) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            } ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
            onClick={interactive && onRatingChange ? () => onRatingChange(star) : undefined}
          />
        ))}
      </div>
    );
  };

  const voteHelpful = async (reviewId: string) => {
    // Placeholder for voting functionality
    toast.success('Voting functionality will be implemented');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Star className="h-6 w-6" />
            My Reviews
          </h2>
          <p className="text-muted-foreground">Share your experience and read feedback</p>
        </div>
        <Dialog open={showNewReview} onOpenChange={setShowNewReview}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Write Review
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Write a Review</DialogTitle>
              <DialogDescription>
                Share your experience to help other customers make informed decisions.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="order">Order</Label>
                <Select value={newReview.order_id} onValueChange={(value) => setNewReview(prev => ({...prev, order_id: value}))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an order to review" />
                  </SelectTrigger>
                  <SelectContent>
                    {orders.map((order) => (
                      <SelectItem key={order.id} value={order.id}>
                        Order #{order.order_number} - {new Date(order.created_at).toLocaleDateString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Rating</Label>
                <div className="mt-2">
                  {renderStars(newReview.rating, true, (rating) => setNewReview(prev => ({...prev, rating})))}
                </div>
              </div>
              <div>
                <Label htmlFor="title">Review Title</Label>
                <Input
                  id="title"
                  value={newReview.title}
                  onChange={(e) => setNewReview(prev => ({...prev, title: e.target.value}))}
                  placeholder="Summarize your experience"
                />
              </div>
              <div>
                <Label htmlFor="review_text">Review</Label>
                <Textarea
                  id="review_text"
                  value={newReview.review_text}
                  onChange={(e) => setNewReview(prev => ({...prev, review_text: e.target.value}))}
                  placeholder="Tell us about your experience with this product or service"
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowNewReview(false)}>
                  Cancel
                </Button>
                <Button onClick={submitReview}>
                  Submit Review
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reviews..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
                <SelectItem value="4">4 Stars</SelectItem>
                <SelectItem value="3">3 Stars</SelectItem>
                <SelectItem value="2">2 Stars</SelectItem>
                <SelectItem value="1">1 Star</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length > 0 ? (
          filteredReviews.map((review) => (
            <Card key={review.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {renderStars(review.rating)}
                      {review.is_verified_purchase && (
                        <Badge variant="outline" className="text-green-600 border-green-300">
                          Verified Purchase
                        </Badge>
                      )}
                      {!review.is_published && (
                        <Badge variant="outline" className="text-orange-600 border-orange-300">
                          Pending Review
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg">{review.title}</CardTitle>
                    <CardDescription>
                      Posted on {new Date(review.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed">{review.review_text}</p>
                
                {/* Store Response */}
                {review.store_response && (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">Store Response</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(review.store_response_date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{review.store_response}</p>
                  </div>
                )}

                {/* Review Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{review.helpful_votes} of {review.total_votes} found this helpful</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => voteHelpful(review.id)}
                    >
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      Helpful
                    </Button>
                    <Button variant="outline" size="sm">
                      Edit Review
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No reviews found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || ratingFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : "You haven't written any reviews yet"
                }
              </p>
              {orders.length > 0 && (
                <Button onClick={() => setShowNewReview(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Write Your First Review
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Review Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Review Guidelines</CardTitle>
          <CardDescription>
            Help us maintain a helpful review community
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">What makes a good review?</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Be specific about your experience</li>
                <li>• Include details about quality and service</li>
                <li>• Mention both pros and cons</li>
                <li>• Keep it relevant to other customers</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Review policies</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Reviews must be based on actual purchases</li>
                <li>• Keep language respectful and constructive</li>
                <li>• No promotional or spam content</li>
                <li>• Reviews are moderated for quality</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};