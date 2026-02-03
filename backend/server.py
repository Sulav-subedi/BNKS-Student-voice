from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import random
import math

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24 * 7

security = HTTPBearer()

ADJECTIVES = ['Swift', 'Brave', 'Calm', 'Bold', 'Noble', 'Wise', 'Quick', 'Silent', 'Fierce', 'Gentle']
NOUNS = ['Falcon', 'River', 'Eagle', 'Lion', 'Tiger', 'Wolf', 'Bear', 'Hawk', 'Phoenix', 'Dragon']

DEPARTMENTS = ['Physics', 'Chemistry', 'Computer', 'Maths', 'Kitchen', 'School Management Team']
CLUBS = ['ARC Club', 'Maths Club', 'Science Club', 'Leo Club', 'Interact Club', 'Social Service Club', 'YRC Club']
HOUSES = ['Gaurishankhar House', 'Choyu House', 'Byasrishi House', 'Ratnachuli House']

def generate_anonymous_tag():
    adj = random.choice(ADJECTIVES)
    noun = random.choice(NOUNS)
    num = random.randint(100, 999)
    return f"{adj}{noun}-{num}"

def create_access_token(user_id: str):
    payload = {
        'user_id': user_id,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get('user_id')
        if not user_id:
            raise HTTPException(status_code=401, detail='Invalid token')
        
        user = await db.users.find_one({'id': user_id}, {'_id': 0})
        if not user:
            raise HTTPException(status_code=401, detail='User not found')
        
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail='Token expired')
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail='Invalid token')

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Literal['Student', 'Teacher', 'Staff']

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra='ignore')
    id: str
    name: str
    email: str
    role: str
    anonymous_tag: str
    created_at: str

class PostCreate(BaseModel):
    title: str
    content: str
    category: Literal['Complaint', 'Suggestion', 'Appreciation']
    target_group_type: Literal['Department', 'Club', 'House']
    target_group_name: str

class Post(BaseModel):
    model_config = ConfigDict(extra='ignore')
    id: str
    title: str
    content: str
    category: str
    target_group_type: str
    target_group_name: str
    author_id: str
    anonymous_tag: str
    upvotes: List[str] = []
    downvotes: List[str] = []
    created_at: str
    comment_count: int = 0

class CommentCreate(BaseModel):
    content: str

class Comment(BaseModel):
    model_config = ConfigDict(extra='ignore')
    id: str
    post_id: str
    author_id: str
    anonymous_tag: str
    content: str
    created_at: str

class Group(BaseModel):
    group_type: str
    group_name: str
    performance_score: float
    appreciation_count: int
    suggestion_count: int
    complaint_count: int
    total_posts: int

class Conversation(BaseModel):
    model_config = ConfigDict(extra='ignore')
    id: str
    participant1_id: str
    participant2_id: str
    last_message: str
    last_message_time: str
    created_at: str

class Message(BaseModel):
    model_config = ConfigDict(extra='ignore')
    id: str
    conversation_id: str
    sender_id: str
    content: str
    created_at: str

class MessageCreate(BaseModel):
    content: str
    conversation_id: str

@api_router.post('/auth/register')
async def register(data: UserRegister):
    try:
        print(f"Registration attempt: {data.email}")
        existing = await db.users.find_one({'email': data.email}, {'_id': 0})
        if existing:
            print("Email already registered")
            raise HTTPException(status_code=400, detail='Email already registered')
        
        print("Hashing password...")
        hashed_password = bcrypt.hashpw(data.password.encode('utf-8'), bcrypt.gensalt())
        
        user_id = str(uuid.uuid4())
        anonymous_tag = generate_anonymous_tag()
        
        user_doc = {
            'id': user_id,
            'name': data.name,
            'email': data.email,
            'password': hashed_password.decode('utf-8'),
            'role': data.role,
            'anonymous_tag': anonymous_tag,
            'created_at': datetime.now(timezone.utc).isoformat()
        }
        
        print("Inserting user...")
        await db.users.insert_one(user_doc)
        
        print("Creating token...")
        token = create_access_token(user_id)
        
        print("Registration successful")
        return {
            'token': token,
            'user': User(
                id=user_id,
                name=data.name,
                email=data.email,
                role=data.role,
                anonymous_tag=anonymous_tag,
                created_at=user_doc['created_at']
            )
        }
    except Exception as e:
        print(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail=f'Registration failed: {str(e)}')

@api_router.post('/auth/login')
async def login(data: UserLogin):
    user = await db.users.find_one({'email': data.email}, {'_id': 0})
    if not user:
        raise HTTPException(status_code=401, detail='Invalid credentials')
    
    if not bcrypt.checkpw(data.password.encode('utf-8'), user['password'].encode('utf-8')):
        raise HTTPException(status_code=401, detail='Invalid credentials')
    
    token = create_access_token(user['id'])
    
    return {
        'token': token,
        'user': User(
            id=user['id'],
            name=user['name'],
            email=user['email'],
            role=user['role'],
            anonymous_tag=user['anonymous_tag'],
            created_at=user['created_at']
        )
    }

@api_router.get('/auth/me', response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    return User(**current_user)

@api_router.post('/posts', response_model=Post)
async def create_post(data: PostCreate, current_user: dict = Depends(get_current_user)):
    if data.target_group_type == 'Department' and data.target_group_name not in DEPARTMENTS:
        raise HTTPException(status_code=400, detail='Invalid department')
    if data.target_group_type == 'Club' and data.target_group_name not in CLUBS:
        raise HTTPException(status_code=400, detail='Invalid club')
    if data.target_group_type == 'House' and data.target_group_name not in HOUSES:
        raise HTTPException(status_code=400, detail='Invalid house')
    
    post_id = str(uuid.uuid4())
    post_doc = {
        'id': post_id,
        'title': data.title,
        'content': data.content,
        'category': data.category,
        'target_group_type': data.target_group_type,
        'target_group_name': data.target_group_name,
        'author_id': current_user['id'],
        'anonymous_tag': current_user['anonymous_tag'],
        'upvotes': [],
        'downvotes': [],
        'created_at': datetime.now(timezone.utc).isoformat(),
        'comment_count': 0
    }
    
    await db.posts.insert_one(post_doc)
    
    return Post(**post_doc)

@api_router.get('/posts', response_model=List[Post])
async def get_posts(
    category: Optional[str] = None,
    target_group_type: Optional[str] = None,
    target_group_name: Optional[str] = None
):
    query = {}
    if category:
        query['category'] = category
    if target_group_type:
        query['target_group_type'] = target_group_type
    if target_group_name:
        query['target_group_name'] = target_group_name
    
    posts = await db.posts.find(query, {'_id': 0}).sort('created_at', -1).to_list(1000)
    return [Post(**post) for post in posts]

@api_router.post('/posts/{post_id}/upvote')
async def upvote_post(post_id: str, current_user: dict = Depends(get_current_user)):
    post = await db.posts.find_one({'id': post_id}, {'_id': 0})
    if not post:
        raise HTTPException(status_code=404, detail='Post not found')
    
    user_id = current_user['id']
    upvotes = post.get('upvotes', [])
    downvotes = post.get('downvotes', [])
    
    if user_id in upvotes:
        upvotes.remove(user_id)
    else:
        upvotes.append(user_id)
        if user_id in downvotes:
            downvotes.remove(user_id)
    
    await db.posts.update_one({'id': post_id}, {'$set': {'upvotes': upvotes, 'downvotes': downvotes}})
    
    return {'upvote_count': len(upvotes), 'downvote_count': len(downvotes)}

@api_router.post('/posts/{post_id}/downvote')
async def downvote_post(post_id: str, current_user: dict = Depends(get_current_user)):
    post = await db.posts.find_one({'id': post_id}, {'_id': 0})
    if not post:
        raise HTTPException(status_code=404, detail='Post not found')
    
    user_id = current_user['id']
    upvotes = post.get('upvotes', [])
    downvotes = post.get('downvotes', [])
    
    if user_id in downvotes:
        downvotes.remove(user_id)
    else:
        downvotes.append(user_id)
        if user_id in upvotes:
            upvotes.remove(user_id)
    
    await db.posts.update_one({'id': post_id}, {'$set': {'upvotes': upvotes, 'downvotes': downvotes}})
    
    return {'upvote_count': len(upvotes), 'downvote_count': len(downvotes)}

@api_router.post('/posts/{post_id}/comments', response_model=Comment)
async def create_comment(post_id: str, data: CommentCreate, current_user: dict = Depends(get_current_user)):
    post = await db.posts.find_one({'id': post_id}, {'_id': 0})
    if not post:
        raise HTTPException(status_code=404, detail='Post not found')
    
    comment_id = str(uuid.uuid4())
    comment_doc = {
        'id': comment_id,
        'post_id': post_id,
        'author_id': current_user['id'],
        'anonymous_tag': current_user['anonymous_tag'],
        'content': data.content,
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    
    await db.comments.insert_one(comment_doc)
    await db.posts.update_one({'id': post_id}, {'$inc': {'comment_count': 1}})
    
    return Comment(**comment_doc)

@api_router.get('/posts/{post_id}/comments', response_model=List[Comment])
async def get_comments(post_id: str):
    comments = await db.comments.find({'post_id': post_id}, {'_id': 0}).sort('created_at', 1).to_list(1000)
    return [Comment(**comment) for comment in comments]

@api_router.get('/groups', response_model=List[Group])
async def get_groups():
    groups = []
    
    for dept in DEPARTMENTS:
        group_data = await calculate_group_score('Department', dept)
        groups.append(group_data)
    
    for club in CLUBS:
        group_data = await calculate_group_score('Club', club)
        groups.append(group_data)
    
    for house in HOUSES:
        group_data = await calculate_group_score('House', house)
        groups.append(group_data)
    
    return groups

async def calculate_group_score(group_type: str, group_name: str) -> Group:
    posts = await db.posts.find({
        'target_group_type': group_type,
        'target_group_name': group_name
    }, {'_id': 0}).to_list(1000)
    
    appreciation_count = len([p for p in posts if p['category'] == 'Appreciation'])
    suggestion_count = len([p for p in posts if p['category'] == 'Suggestion'])
    complaint_count = len([p for p in posts if p['category'] == 'Complaint'])
    total_posts = len(posts)
    
    if total_posts < 5:
        return Group(
            group_type=group_type,
            group_name=group_name,
            performance_score=50.0,
            appreciation_count=appreciation_count,
            suggestion_count=suggestion_count,
            complaint_count=complaint_count,
            total_posts=total_posts
        )
    
    now = datetime.now(timezone.utc)
    sentiment_numerator = 0.0
    sentiment_denominator = 0.0
    
    for post in posts:
        created_at = datetime.fromisoformat(post['created_at'])
        age_days = (now - created_at).total_seconds() / 86400
        decay = math.exp(-age_days / 30)
        
        weight = 0.0
        if post['category'] == 'Appreciation':
            weight = 1.0
        elif post['category'] == 'Suggestion':
            weight = 0.2
        elif post['category'] == 'Complaint':
            weight = -1.2
        
        sentiment_numerator += weight * decay
        sentiment_denominator += decay
    
    sentiment = sentiment_numerator / sentiment_denominator if sentiment_denominator > 0 else 0
    score = max(0.0, min(100.0, (sentiment + 1) * 50))
    
    return Group(
        group_type=group_type,
        group_name=group_name,
        performance_score=round(score, 1),
        appreciation_count=appreciation_count,
        suggestion_count=suggestion_count,
        complaint_count=complaint_count,
        total_posts=total_posts
    )

# Messaging endpoints
@api_router.get('/conversations', response_model=List[Conversation])
async def get_conversations(current_user: dict = Depends(get_current_user)):
    conversations = await db.conversations.find({
        '$or': [
            {'participant1_id': current_user['id']},
            {'participant2_id': current_user['id']}
        ]
    }, {'_id': 0}).sort('last_message_time', -1).to_list(1000)
    
    return [Conversation(**conv) for conv in conversations]

@api_router.post('/conversations', response_model=Conversation)
async def create_or_get_conversation(other_user_id: str = None, current_user: dict = Depends(get_current_user)):
    if not other_user_id:
        raise HTTPException(status_code=400, detail='other_user_id is required')
    
    if other_user_id == current_user['id']:
        raise HTTPException(status_code=400, detail='Cannot create conversation with yourself')
    
    # Check if conversation already exists
    existing = await db.conversations.find_one({
        '$or': [
            {'participant1_id': current_user['id'], 'participant2_id': other_user_id},
            {'participant1_id': other_user_id, 'participant2_id': current_user['id']}
        ]
    }, {'_id': 0})
    
    if existing:
        return Conversation(**existing)
    
    # Check if other user exists
    other_user = await db.users.find_one({'id': other_user_id}, {'_id': 0})
    if not other_user:
        raise HTTPException(status_code=404, detail='User not found')
    
    # Create new conversation
    conversation_id = str(uuid.uuid4())
    conversation_doc = {
        'id': conversation_id,
        'participant1_id': current_user['id'],
        'participant2_id': other_user_id,
        'last_message': '',
        'last_message_time': datetime.now(timezone.utc).isoformat(),
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    
    await db.conversations.insert_one(conversation_doc)
    return Conversation(**conversation_doc)

@api_router.get('/conversations/{conversation_id}/messages', response_model=List[Message])
async def get_messages(conversation_id: str, current_user: dict = Depends(get_current_user)):
    # Check if user is part of conversation
    conversation = await db.conversations.find_one({
        'id': conversation_id,
        '$or': [
            {'participant1_id': current_user['id']},
            {'participant2_id': current_user['id']}
        ]
    })
    
    if not conversation:
        raise HTTPException(status_code=404, detail='Conversation not found')
    
    messages = await db.messages.find({
        'conversation_id': conversation_id
    }, {'_id': 0}).sort('created_at', 1).to_list(1000)
    
    return [Message(**msg) for msg in messages]

@api_router.post('/messages', response_model=Message)
async def send_message(data: MessageCreate, current_user: dict = Depends(get_current_user)):
    # Check if user is part of conversation
    conversation = await db.conversations.find_one({
        'id': data.conversation_id,
        '$or': [
            {'participant1_id': current_user['id']},
            {'participant2_id': current_user['id']}
        ]
    })
    
    if not conversation:
        raise HTTPException(status_code=404, detail='Conversation not found')
    
    # Create message
    message_id = str(uuid.uuid4())
    message_doc = {
        'id': message_id,
        'conversation_id': data.conversation_id,
        'sender_id': current_user['id'],
        'content': data.content,
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    
    await db.messages.insert_one(message_doc)
    
    # Update conversation's last message
    await db.conversations.update_one(
        {'id': data.conversation_id},
        {
            '$set': {
                'last_message': data.content,
                'last_message_time': datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    return Message(**message_doc)

@api_router.get('/users/search')
async def search_users(q: str, current_user: dict = Depends(get_current_user)):
    if len(q) < 2:
        return []
    
    # Prevent exact UUID matching to avoid user enumeration
    import re
    uuid_pattern = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', re.IGNORECASE)
    if uuid_pattern.match(q):
        return []
    
    try:
        users = await db.users.find({
            '$and': [
                {'id': {'$ne': current_user['id']}},
                {'$or': [
                    {'anonymous_tag': {'$regex': q, '$options': 'i'}},
                    {'name': {'$regex': q, '$options': 'i'}}
                ]}
            ]
        }, {'_id': 0, 'password': 0, 'email': 0}).to_list(20)
        
        # Return users but only expose anonymous tag and id
        return [{
            'id': user['id'],
            'name': user['anonymous_tag'],  # Show anonymous tag as the "name"
            'anonymous_tag': user['anonymous_tag'],
            'role': user['role'],
            'created_at': user['created_at']
        } for user in users]
    except Exception as e:
        print(f"Search error: {e}")
        raise HTTPException(status_code=500, detail=f'Search failed: {str(e)}')

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=['*'],
    allow_headers=['*'],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event('shutdown')
async def shutdown_db_client():
    client.close()
