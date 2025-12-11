import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, ArrowLeft, Users, Check, CheckCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface User {
  id: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  createdAt: string;
  lastMessageAt: string;
  otherUser: User;
  lastMessage?: Message;
  unreadCount: number;
  otherUserLastReadAt?: string;
}

export default function Chat() {
  const { firebaseUser } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [connections, setConnections] = useState<User[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    if (!firebaseUser) return {};
    const token = await firebaseUser.getIdToken();
    return { Authorization: `Bearer ${token}` };
  };

  const fetchConversations = async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/chat/conversations", { headers });
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  const fetchConnections = async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/chat/connections", { headers });
      if (res.ok) {
        const data = await res.json();
        setConnections(data);
      }
    } catch (error) {
      console.error("Error fetching connections:", error);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/chat/conversations/${conversationId}/messages`, { headers });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.reverse());
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const startConversation = async (userId: string) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ otherUserId: userId }),
      });
      if (res.ok) {
        const conversation = await res.json();
        await fetchConversations();
        const user = connections.find(c => c.id === userId);
        if (user) {
          setSelectedConversation({
            ...conversation,
            otherUser: user,
            unreadCount: 0,
          });
          await fetchMessages(conversation.id);
        }
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sendingMessage) return;
    
    setSendingMessage(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/chat/conversations/${selectedConversation.id}/messages`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage }),
      });
      if (res.ok) {
        const message = await res.json();
        setMessages(prev => [...prev, message]);
        setNewMessage("");
        await fetchConversations();
      } else {
        const error = await res.json();
        toast({
          title: "Failed to send message",
          description: error.error || "Something went wrong",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const markAsRead = async (conversationId: string) => {
    try {
      const headers = await getAuthHeaders();
      await fetch(`/api/chat/conversations/${conversationId}/read`, {
        method: "POST",
        headers,
      });
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  useEffect(() => {
    if (!firebaseUser) return;
    
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchConversations(), fetchConnections()]);
      setLoading(false);
    };
    load();
  }, [firebaseUser]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      markAsRead(selectedConversation.id);
      
      pollIntervalRef.current = setInterval(() => {
        fetchMessages(selectedConversation.id);
      }, 3000);
    }
    
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [selectedConversation?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getUserDisplayName = (user: User) => {
    if (user.firstName) return user.firstName;
    if (user.username) return `@${user.username}`;
    return "User";
  };

  const getUserInitial = (user: User) => {
    if (user.firstName) return user.firstName[0].toUpperCase();
    if (user.username) return user.username[0].toUpperCase();
    return "U";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Loading chats...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" data-testid="page-chat">
      <div className="flex items-center gap-3 mb-6">
        <MessageCircle className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Messages</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0 overflow-hidden">
        <Card className="lg:col-span-1 overflow-hidden flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Conversations</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              {conversations.length === 0 && connections.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No connections yet</p>
                  <p className="text-sm mt-1">
                    Follow people and have them follow you back to start chatting
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedConversation?.id === conv.id ? "bg-muted" : ""
                      }`}
                      onClick={() => setSelectedConversation(conv)}
                      data-testid={`conversation-${conv.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={conv.otherUser.profileImageUrl || undefined} />
                          <AvatarFallback>{getUserInitial(conv.otherUser)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium truncate">{getUserDisplayName(conv.otherUser)}</p>
                            {conv.unreadCount > 0 && (
                              <Badge variant="default" className="ml-2">{conv.unreadCount}</Badge>
                            )}
                          </div>
                          {conv.lastMessage && (
                            <p className="text-sm text-muted-foreground truncate">
                              {conv.lastMessage.content}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {connections.filter(c => !conversations.some(conv => conv.otherUser.id === c.id)).length > 0 && (
                    <>
                      <div className="px-3 py-2 bg-muted/30 text-xs font-medium text-muted-foreground uppercase">
                        Start a new conversation
                      </div>
                      {connections
                        .filter(c => !conversations.some(conv => conv.otherUser.id === c.id))
                        .map((user) => (
                          <div
                            key={user.id}
                            className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => startConversation(user.id)}
                            data-testid={`start-chat-${user.id}`}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={user.profileImageUrl || undefined} />
                                <AvatarFallback>{getUserInitial(user)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="font-medium">{getUserDisplayName(user)}</p>
                                <p className="text-sm text-muted-foreground">Click to start chatting</p>
                              </div>
                            </div>
                          </div>
                        ))}
                    </>
                  )}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 flex flex-col overflow-hidden">
          {selectedConversation ? (
            <>
              <CardHeader className="pb-3 border-b flex-row items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setSelectedConversation(null)}
                  data-testid="button-back"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedConversation.otherUser.profileImageUrl || undefined} />
                  <AvatarFallback>{getUserInitial(selectedConversation.otherUser)}</AvatarFallback>
                </Avatar>
                <CardTitle className="text-lg">{getUserDisplayName(selectedConversation.otherUser)}</CardTitle>
              </CardHeader>
              
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No messages yet</p>
                      <p className="text-sm">Say hello!</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isSent = msg.senderId === firebaseUser?.uid;
                      const isRead = isSent && selectedConversation?.otherUserLastReadAt && 
                        new Date(selectedConversation.otherUserLastReadAt) >= new Date(msg.createdAt);
                      
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isSent ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                              isSent
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                            data-testid={`message-${msg.id}`}
                          >
                            <p>{msg.content}</p>
                            <div className={`flex items-center gap-1 mt-1 ${
                              isSent 
                                ? "text-primary-foreground/70" 
                                : "text-muted-foreground"
                            }`}>
                              <span className="text-xs">
                                {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                              </span>
                              {isSent && (
                                <span className="flex items-center" data-testid={`read-status-${msg.id}`}>
                                  {isRead ? (
                                    <CheckCheck className="h-3.5 w-3.5 text-blue-400" />
                                  ) : (
                                    <Check className="h-3.5 w-3.5" />
                                  )}
                                </span>
                              )}
                            </div>
                            {isSent && isRead && selectedConversation?.otherUserLastReadAt && (
                              <p className="text-xs text-primary-foreground/50 mt-0.5" data-testid={`read-time-${msg.id}`}>
                                Read {formatDistanceToNow(new Date(selectedConversation.otherUserLastReadAt), { addSuffix: true })}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              
              <div className="p-4 border-t">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }}
                  className="flex gap-2"
                >
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1"
                    data-testid="input-message"
                  />
                  <Button 
                    type="submit" 
                    disabled={!newMessage.trim() || sendingMessage}
                    data-testid="button-send"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">Select a conversation</p>
                <p className="text-sm">Choose someone from the list to start chatting</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
