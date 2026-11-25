import React, { useState, useRef } from 'react';
import {
  Session,
  SessionPhoto,
  SessionVideoLink,
  addPhotoToSession,
  removePhotoFromSession,
  togglePhotoLike,
  addVideoLinkToSession,
  removeVideoLinkFromSession,
} from '../../services/db';
import {
  uploadImageToCloud,
  getSavedImgbbApiKey,
  setSavedImgbbApiKey,
} from '../../services/imageUpload';
import { sound } from '../../services/soundboard';
import { haptics } from '../../services/haptics';
import confetti from 'canvas-confetti';
import {
  X,
  Camera,
  Video,
  Plus,
  Trash2,
  Sparkles,
  ExternalLink,
  Heart,
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2,
  Image as ImageIcon,
  CheckCircle,
  Key,
} from 'lucide-react';

interface SessionMemoriesModalProps {
  session: Session;
  onClose: () => void;
}

// Group photos into Instagram posts (standalone or carousels)
interface CarouselPost {
  groupId: string;
  photos: SessionPhoto[];
  caption?: string;
  timestamp: number;
}

export const SessionMemoriesModal: React.FC<SessionMemoriesModalProps> = ({
  session,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'photos' | 'videos'>('photos');

  // Compose Post state
  const [isComposing, setIsComposing] = useState<boolean>(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [composeCaption, setComposeCaption] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgressText, setUploadProgressText] = useState<string>('');

  // Active slide index for each carousel post: groupId -> slideIndex
  const [slideIndexes, setSlideIndexes] = useState<Record<string, number>>({});

  // Floating heart animation trigger: photoId -> boolean
  const [heartAnimId, setHeartAnimId] = useState<string | null>(null);

  // Fullscreen zoom lightbox
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Video Form state
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [videoTitle, setVideoTitle] = useState<string>('');
  const [videoError, setVideoError] = useState<string | null>(null);

  // Cloud Key Modal state
  const [isKeyModalOpen, setIsKeyModalOpen] = useState<boolean>(false);
  const [apiKeyInput, setApiKeyInput] = useState<string>(getSavedImgbbApiKey);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const dragStartXRef = useRef<number | null>(null);
  const dragStartYRef = useRef<number | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  const handleDragStart = (clientX: number, clientY: number) => {
    dragStartXRef.current = clientX;
    dragStartYRef.current = clientY;
    isDraggingRef.current = true;
  };

  const handleDragEnd = (
    clientX: number,
    clientY: number,
    groupId: string,
    totalSlides: number,
    activeSlide: number,
    photoUrl: string
  ) => {
    if (!isDraggingRef.current || dragStartXRef.current === null) return;
    const deltaX = dragStartXRef.current - clientX;
    const deltaY = dragStartYRef.current !== null ? Math.abs(dragStartYRef.current - clientY) : 0;

    isDraggingRef.current = false;
    dragStartXRef.current = null;
    dragStartYRef.current = null;

    // If it was a tap / click with almost no movement (< 8px), open fullscreen lightbox!
    if (Math.abs(deltaX) < 8 && deltaY < 8) {
      if (photoUrl) setLightboxUrl(photoUrl);
      return;
    }

    // If it was a horizontal swipe gesture (stylus, touch, or mouse drag)
    if (totalSlides > 1 && Math.abs(deltaX) > 25 && Math.abs(deltaX) > deltaY) {
      if (deltaX > 0 && activeSlide < totalSlides - 1) {
        sound.playWhoosh();
        haptics.light();
        setSlideIndexes(prev => ({ ...prev, [groupId]: activeSlide + 1 }));
      } else if (deltaX < 0 && activeSlide > 0) {
        sound.playWhoosh();
        haptics.light();
        setSlideIndexes(prev => ({ ...prev, [groupId]: activeSlide - 1 }));
      }
    }
  };

  // Handle Photo Picker Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files);
    setSelectedFiles(filesArray);

    const previews = filesArray.map(f => URL.createObjectURL(f));
    setPreviewUrls(previews);
    setComposeCaption('');
    setIsComposing(true);
    sound.playPop();

    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  // Submit Compose Post to Cloud (ImgBB)
  const handlePublishPost = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    sound.playPop();
    const groupId = 'group_' + Date.now();

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        setUploadProgressText(`Uploading ${i + 1} of ${selectedFiles.length} to cloud...`);
        const file = selectedFiles[i];

        // 1-Click Cloud upload to ImgBB (0 bytes on PC storage!)
        const cloudUrl = await uploadImageToCloud(file);

        // Save permanent cloud link to session
        await addPhotoToSession(
          session.id,
          cloudUrl,
          i === 0 ? composeCaption : undefined,
          groupId
        );
      }

      sound.playSuccess();
      haptics.success();
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });

      // Clean up object URLs
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      setSelectedFiles([]);
      setPreviewUrls([]);
      setComposeCaption('');
      setIsComposing(false);
    } catch (err: any) {
      console.error('Upload failed:', err);
      alert('Could not upload to cloud: ' + (err.message || 'Please check your connection'));
    } finally {
      setIsUploading(false);
      setUploadProgressText('');
    }
  };

  const handleCancelCompose = () => {
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setSelectedFiles([]);
    setPreviewUrls([]);
    setComposeCaption('');
    setIsComposing(false);
    sound.playPop();
  };

  // Like a Photo
  const handleLike = async (photoId: string) => {
    sound.playPop();
    haptics.light();
    setHeartAnimId(photoId);
    setTimeout(() => setHeartAnimId(null), 600);
    await togglePhotoLike(session.id, photoId);
  };

  // Delete a Photo
  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('Delete this photo?')) return;
    sound.playBuzzer();
    haptics.light();
    await removePhotoFromSession(session.id, photoId);
  };

  // Add YouTube Video
  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl.trim()) return;

    setVideoError(null);
    try {
      await addVideoLinkToSession(session.id, videoUrl, videoTitle);
      sound.playSuccess();
      haptics.success();
      setVideoUrl('');
      setVideoTitle('');
    } catch (err: any) {
      sound.playBuzzer();
      setVideoError(err.message || 'Invalid YouTube URL');
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm('Remove this video?')) return;
    sound.playBuzzer();
    haptics.light();
    await removeVideoLinkFromSession(session.id, videoId);
  };

  // Group photos into posts
  const photos = session.photos || [];
  const videos = session.videoLinks || [];

  const postMap = new Map<string, CarouselPost>();
  photos.forEach(photo => {
    const key = photo.carouselGroupId || photo.id;
    if (!postMap.has(key)) {
      postMap.set(key, {
        groupId: key,
        photos: [photo],
        caption: photo.caption,
        timestamp: photo.timestamp,
      });
    } else {
      const post = postMap.get(key)!;
      post.photos.push(photo);
      if (!post.caption && photo.caption) post.caption = photo.caption;
    }
  });

  const posts = Array.from(postMap.values());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-lg bg-[#FFFDF7] border-4 border-black rounded-3xl p-4 sm:p-5 space-y-4 shadow-[10px_10px_0px_#000] max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl border-2 border-black bg-gradient-to-tr from-amber-400 via-rose-400 to-purple-500 flex items-center justify-center text-white shadow-[2px_2px_0px_#000]">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#18181B] leading-none">Game Night Feed</h2>
              <p className="text-[11px] font-bold text-gray-500">
                100% Free Cloud Hosted (0 MB on your PC)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                sound.playPop();
                setIsKeyModalOpen(true);
              }}
              className="p-1.5 px-2.5 rounded-xl border-2 border-black hover:bg-gray-100 text-xs font-black flex items-center gap-1 bg-white shadow-[1px_1px_0px_#000]"
              title="ImgBB Cloud API Key (Optional)"
            >
              <Key className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline text-[11px]">Cloud Key</span>
            </button>
            <button
              onClick={() => {
                sound.playPop();
                onClose();
              }}
              className="p-1.5 rounded-xl border-2 border-black hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              sound.playPop();
              setActiveTab('photos');
            }}
            className={`py-2 text-xs font-black rounded-xl border-2 border-black flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'photos'
                ? 'bg-[#FEF08A] shadow-[2px_2px_0px_#000]'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            Photos ({photos.length})
          </button>

          <button
            onClick={() => {
              sound.playPop();
              setActiveTab('videos');
            }}
            className={`py-2 text-xs font-black rounded-xl border-2 border-black flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'videos'
                ? 'bg-[#FECDD3] shadow-[2px_2px_0px_#000]'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Video className="w-4 h-4" />
            Videos ({videos.length})
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* TAB 1: INSTAGRAM PHOTO FEED */}
          {activeTab === 'photos' && (
            <div className="space-y-4">
              {/* Share New Post CTA Bar */}
              <div className="neo-card p-3.5 bg-gradient-to-r from-amber-50 via-yellow-100 to-amber-100 border-3 border-black flex items-center justify-between shadow-[3px_3px_0px_#000]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full border-2 border-black bg-white flex items-center justify-center text-base">
                    ✨
                  </div>
                  <div>
                    <div className="text-xs font-black text-[#18181B]">Capture Tonight's Memories</div>
                    <div className="text-[10px] font-bold text-gray-600">
                      Upload with captions &amp; carousels
                    </div>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />

                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      sound.playCameraShutter();
                      cameraInputRef.current?.click();
                    }}
                    className="neo-btn neo-btn-sm py-2 px-2.5 bg-[#A7F3D0] hover:bg-[#86EFAC] text-xs font-black text-emerald-950 flex items-center gap-1 shadow-[2px_2px_0px_#000]"
                    title="Take photo now with camera"
                  >
                    <Camera className="w-3.5 h-3.5 stroke-[2.5]" /> Snap
                  </button>

                  <button
                    onClick={() => {
                      sound.playPop();
                      fileInputRef.current?.click();
                    }}
                    className="neo-btn neo-btn-sm py-2 px-2.5 bg-[#FEF08A] hover:bg-[#FDE047] text-xs font-black text-amber-950 flex items-center gap-1 shadow-[2px_2px_0px_#000]"
                    title="Choose from gallery or files"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" /> Photos
                  </button>
                </div>
              </div>

              {/* FEED POSTS */}
              {posts.length === 0 ? (
                <div className="p-8 rounded-3xl border-3 border-dashed border-gray-300 text-center space-y-2">
                  <div className="text-4xl animate-bounce">📸</div>
                  <div className="text-sm font-black text-gray-700">No party photos yet</div>
                  <p className="text-xs font-bold text-gray-500">
                    Snap selfies or funny moments and share them with your party crew!
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {posts.map(post => {
                    const activeSlide = slideIndexes[post.groupId] || 0;
                    const currentPhoto = post.photos[activeSlide] || post.photos[0];
                    const isCarousel = post.photos.length > 1;
                    const isHeartAnimating = heartAnimId === currentPhoto.id;

                    return (
                      <div
                        key={post.groupId}
                        className="bg-white rounded-3xl border-3 border-black shadow-[4px_4px_0px_#000] overflow-hidden space-y-2.5 pb-3"
                      >
                        {/* Post Header */}
                        <div className="flex items-center justify-between px-3.5 pt-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full border-2 border-black bg-gradient-to-tr from-yellow-300 to-amber-500 flex items-center justify-center text-sm shadow-[1px_1px_0px_#000]">
                              🎉
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-black text-[#18181B] leading-none">
                                  {session.title}
                                </span>
                                {currentPhoto.url && currentPhoto.url.startsWith('http') ? (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-400 text-[10px] font-black leading-none flex items-center gap-0.5">
                                    ☁️ Cloud
                                  </span>
                                ) : (
                                  <span
                                    className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-400 text-[10px] font-black leading-none flex items-center gap-0.5"
                                    title="Saved safely in your browser IndexedDB database. Stays intact across tab and browser restarts!"
                                  >
                                    💾 Local
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] font-bold text-gray-500 pt-0.5">
                                {new Date(post.timestamp).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeletePhoto(currentPhoto.id)}
                            className="p-1 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete this photo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Image Viewer / Carousel Area */}
                        <div
                          className="relative aspect-4/3 sm:aspect-square w-full bg-slate-900 flex items-center justify-center overflow-hidden border-y-2 border-black select-none touch-pan-y cursor-grab active:cursor-grabbing"
                          onPointerDown={(e) => {
                            handleDragStart(e.clientX, e.clientY);
                          }}
                          onPointerUp={(e) => {
                            handleDragEnd(
                              e.clientX,
                              e.clientY,
                              post.groupId,
                              post.photos.length,
                              activeSlide,
                              currentPhoto.url || currentPhoto.dataUrl || ''
                            );
                          }}
                          onPointerCancel={() => {
                            isDraggingRef.current = false;
                            dragStartXRef.current = null;
                            dragStartYRef.current = null;
                          }}
                        >
                          {/* Big Prominent Floating Storage Status Badge directly on the photo */}
                          <div className="absolute top-2.5 left-2.5 z-20 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md text-white text-[11px] font-black border border-white/25 flex items-center gap-1 shadow-md pointer-events-none">
                            {currentPhoto.url && currentPhoto.url.startsWith('http') ? (
                              <span className="text-emerald-300 flex items-center gap-1">
                                ☁️ Cloud Hosted
                              </span>
                            ) : (
                              <span className="text-amber-300 flex items-center gap-1">
                                💾 Local Memory (0 MB Disk)
                              </span>
                            )}
                          </div>

                          <img
                            src={currentPhoto.url || currentPhoto.dataUrl}
                            alt="Party Post"
                            loading="lazy"
                            draggable={false}
                            className="w-full h-full object-cover pointer-events-none select-none transition-transform duration-300"
                          />

                          {/* Floating heart on double tap / like */}
                          {isHeartAnimating && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-ping">
                              <Heart className="w-20 h-20 text-rose-500 fill-rose-500 stroke-[3]" />
                            </div>
                          )}

                          {/* Carousel Left / Right Arrows */}
                          {isCarousel && (
                            <>
                              {activeSlide > 0 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    sound.playWhoosh();
                                    setSlideIndexes(prev => ({
                                      ...prev,
                                      [post.groupId]: activeSlide - 1,
                                    }));
                                  }}
                                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 border-2 border-black flex items-center justify-center shadow-lg active:scale-90"
                                >
                                  <ChevronLeft className="w-5 h-5 stroke-[3]" />
                                </button>
                              )}

                              {activeSlide < post.photos.length - 1 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    sound.playWhoosh();
                                    setSlideIndexes(prev => ({
                                      ...prev,
                                      [post.groupId]: activeSlide + 1,
                                    }));
                                  }}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 border-2 border-black flex items-center justify-center shadow-lg active:scale-90"
                                >
                                  <ChevronRight className="w-5 h-5 stroke-[3]" />
                                </button>
                              )}

                              {/* Slide Counter Badge */}
                              <div className="absolute top-2.5 right-2.5 z-20 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md text-white text-[11px] font-black border border-white/25 pointer-events-none">
                                {activeSlide + 1}/{post.photos.length}
                              </div>
                            </>
                          )}
                        </div>

                        {/* Carousel Dots Indicator */}
                        {isCarousel && (
                          <div className="flex items-center justify-center gap-1.5 pt-0.5">
                            {post.photos.map((_, dotIdx) => (
                              <button
                                key={dotIdx}
                                onClick={() =>
                                  setSlideIndexes(prev => ({
                                    ...prev,
                                    [post.groupId]: dotIdx,
                                  }))
                                }
                                className={`rounded-full transition-all ${
                                  dotIdx === activeSlide
                                    ? 'w-2 h-2 bg-black'
                                    : 'w-1.5 h-1.5 bg-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        )}

                        {/* Post Actions & Likes */}
                        <div className="px-3.5 space-y-1.5">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleLike(currentPhoto.id)}
                              className="flex items-center gap-1 text-xs font-black text-rose-600 hover:scale-110 active:scale-90 transition-all"
                            >
                              <Heart
                                className={`w-5 h-5 ${
                                  (currentPhoto.likes || 0) > 0
                                    ? 'fill-rose-500 text-rose-500'
                                    : 'text-gray-700'
                                }`}
                              />
                              <span className="text-gray-900 font-mono">
                                {currentPhoto.likes || 0}
                              </span>
                            </button>
                          </div>

                          {/* Caption */}
                          {post.caption && (
                            <div className="text-xs font-bold text-gray-800 leading-snug">
                              <span className="font-black text-[#18181B] mr-1.5">
                                {session.players[0]?.name || 'Party Pop'}:
                              </span>
                              {post.caption}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: VIDEOS */}
          {activeTab === 'videos' && (
            <div className="space-y-4">
              <form
                onSubmit={handleAddVideo}
                className="neo-card p-4 bg-white border-3 border-black space-y-2.5 shadow-[3px_3px_0px_#000]"
              >
                <div className="text-xs font-black uppercase text-red-950 flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-red-600" /> Add YouTube Unlisted Link / Short
                </div>

                <div className="space-y-1.5">
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={e => setVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=... or youtu.be/..."
                    required
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border-2 border-black bg-gray-50 focus:outline-none focus:bg-white"
                  />
                  <input
                    type="text"
                    value={videoTitle}
                    onChange={e => setVideoTitle(e.target.value)}
                    placeholder="Optional title (e.g. 'Rahul’s epic charades fail')"
                    className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border-2 border-black bg-gray-50 focus:outline-none focus:bg-white"
                  />
                </div>

                {videoError && (
                  <div className="text-[11px] font-black text-red-600">{videoError}</div>
                )}

                <button
                  type="submit"
                  className="w-full neo-btn neo-btn-sm py-2 bg-[#FECDD3] hover:bg-[#FDA4AF] text-xs font-black text-red-950 flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4 stroke-[3]" /> Add YouTube Memory
                </button>
              </form>

              {videos.length === 0 ? (
                <div className="p-8 rounded-3xl border-3 border-dashed border-gray-300 text-center space-y-2">
                  <div className="text-4xl">🎥</div>
                  <div className="text-sm font-black text-gray-700">No videos saved yet</div>
                  <p className="text-xs font-bold text-gray-500">
                    Upload a video to YouTube as "Unlisted", then paste the link here to re-watch anytime!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {videos.map(video => (
                    <div
                      key={video.id}
                      className="neo-card p-3 bg-white border-3 border-black space-y-2 shadow-[3px_3px_0px_#000]"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs font-black text-[#18181B] truncate max-w-[240px]">
                            {video.title}
                          </div>
                          <div className="text-[10px] font-bold text-gray-500">
                            {new Date(video.timestamp).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <a
                            href={video.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg border-2 border-black bg-gray-50 hover:bg-gray-100 text-gray-800"
                            title="Open in YouTube"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => handleDeleteVideo(video.id)}
                            className="p-1.5 rounded-lg border-2 border-black bg-rose-100 hover:bg-rose-200 text-rose-950"
                            title="Remove video"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="aspect-video w-full rounded-xl overflow-hidden border-2 border-black bg-black">
                        <iframe
                          src={`https://www.youtube.com/embed/${video.youtubeId}`}
                          title={video.title || 'YouTube Video'}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full border-0"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t-2 border-black">
          <button
            onClick={() => {
              sound.playPop();
              onClose();
            }}
            className="w-full neo-btn py-3 bg-[#FEF08A] hover:bg-[#FDE047] text-sm font-black text-[#18181B]"
          >
            Done with Memories ✓
          </button>
        </div>
      </div>

      {/* INSTAGRAM-STYLE COMPOSE OVERLAY */}
      {isComposing && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-3 animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl border-4 border-black p-4 space-y-3.5 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <span className="text-sm font-black text-[#18181B]">New Memory Post</span>
              <button
                disabled={isUploading}
                onClick={handleCancelCompose}
                className="p-1 rounded-lg border border-black hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thumbnail Preview(s) */}
            <div className="relative aspect-square w-full rounded-2xl border-3 border-black overflow-hidden bg-slate-900">
              <img
                src={previewUrls[0]}
                alt="Selected"
                className="w-full h-full object-cover"
              />
              {previewUrls.length > 1 && (
                <div className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full bg-black/70 text-white text-[10px] font-black border border-white/20">
                  1 of {previewUrls.length} photos
                </div>
              )}
            </div>

            {/* Caption Input */}
            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase text-gray-500">Caption</label>
              <textarea
                value={composeCaption}
                onChange={e => setComposeCaption(e.target.value)}
                placeholder="Write a caption... (e.g. 'Sneha trying to act like a submarine 🤣')"
                rows={2}
                disabled={isUploading}
                className="w-full px-3 py-2 text-xs font-bold rounded-xl border-2 border-black bg-gray-50 focus:outline-none focus:bg-white resize-none"
              />
            </div>

            {/* Upload Button */}
            <button
              onClick={handlePublishPost}
              disabled={isUploading}
              className="w-full neo-btn py-3.5 bg-[#FEF08A] hover:bg-[#FDE047] text-sm font-black text-[#18181B] flex items-center justify-center gap-2 shadow-[3px_3px_0px_#000]"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{uploadProgressText || 'Uploading to Cloud...'}</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 stroke-[2.5]" />
                  <span>Share to Game Night Feed 🚀</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ImgBB Cloud Key Settings Modal */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white border-3 border-black rounded-2xl p-5 space-y-4 shadow-[6px_6px_0px_#000]">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-[#18181B] flex items-center gap-1.5">
                <Key className="w-4 h-4 text-amber-600" /> ImgBB Cloud Key
              </h3>
              <button
                onClick={() => setIsKeyModalOpen(false)}
                className="p-1 rounded-lg border border-black hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs font-bold text-gray-600 leading-snug">
              Optional: Enter your free personal API key from{' '}
              <a
                href="https://api.imgbb.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 underline font-black"
              >
                api.imgbb.com
              </a>{' '}
              for permanent ImgBB CDN hosting. If empty, photos are stored in high-res zero-disk browser memory!
            </p>

            <input
              type="text"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="Paste 32-character API key..."
              className="w-full p-2.5 rounded-xl border-2 border-black text-xs font-mono"
            />

            <div className="flex gap-2">
              <button
                onClick={() => {
                  sound.playSuccess();
                  setSavedImgbbApiKey(apiKeyInput);
                  setIsKeyModalOpen(false);
                }}
                className="flex-1 neo-btn py-2.5 bg-[#A7F3D0] hover:bg-[#86EFAC] text-xs font-black text-[#18181B]"
              >
                Save Key
              </button>
              {apiKeyInput && (
                <button
                  onClick={() => {
                    sound.playPop();
                    setApiKeyInput('');
                    setSavedImgbbApiKey('');
                  }}
                  className="px-3 py-2.5 rounded-xl border-2 border-black bg-rose-50 text-xs font-black text-red-700"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Zoom Modal */}
      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          className="fixed inset-0 z-70 bg-black/95 flex items-center justify-center p-3 cursor-zoom-out animate-fade-in"
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img
              src={lightboxUrl}
              alt="Enlarged Memory"
              className="max-w-full max-h-[90vh] rounded-2xl border-4 border-white object-contain shadow-2xl"
            />
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute -top-3 -right-3 p-2 rounded-full bg-white text-black font-black border-2 border-black shadow-lg"
            >
              <X className="w-5 h-5 stroke-[3]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
