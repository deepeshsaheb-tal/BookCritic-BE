import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Book } from '../../books/entities/book.entity';

/**
 * Service for OpenAI API integration
 */
@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private readonly apiKey: string;
  private readonly apiUrl = 'https://api.openai.com/v1/chat/completions';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('OPENAI_API_KEY');
  }

  /**
   * Get book recommendations using OpenAI
   * @param userPreferences - User preferences and reading history
   * @param availableBooks - Available books to recommend from
   * @param limit - Maximum number of recommendations to return
   * @returns Array of recommended books
   */
  async getBookRecommendations(
    userPreferences: {
      favoriteGenres: string[];
      favoriteAuthors: string[];
      recentlyRead: string[];
      highlyRated: string[];
    },
    availableBooks: Book[],
    limit = 5,
  ): Promise<Book[]> {
    try {
      if (!this.apiKey) {
        this.logger.warn('OpenAI API key not configured');
        return [];
      }

      // Prepare data for the OpenAI prompt
      const bookData = availableBooks.map(book => ({
        id: book.id,
        title: book.title,
        author: book.author,
        genres: book.bookGenres?.map(bg => bg.genre?.name).filter(Boolean) || [],
        averageRating: book.averageRating,
        description: book.description?.substring(0, 100) + '...',
      }));

      // Create the prompt for OpenAI
      const prompt = `
        I need book recommendations for a user with these preferences:
        - Favorite genres: ${userPreferences.favoriteGenres.join(', ')}
        - Favorite authors: ${userPreferences.favoriteAuthors.join(', ')}
        - Recently read books: ${userPreferences.recentlyRead.join(', ')}
        - Highly rated books: ${userPreferences.highlyRated.join(', ')}

        Please recommend ${limit} books from the following list that this user would enjoy.
        Only respond with the book IDs in a JSON array format like ["id1", "id2", ...].
        
        Available books:
        ${JSON.stringify(bookData, null, 2)}
      `;

      // Call OpenAI API
      const response = await axios.post(
        this.apiUrl,
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a book recommendation assistant. Respond only with the requested JSON format.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 150,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
        },
      );

      // Parse the response to get recommended book IDs
      const content = response.data.choices[0]?.message?.content;
      if (!content) {
        return [];
      }

      // Extract JSON array from the response
      const match = content.match(/\[.*\]/); // Removed 's' flag for ES2018 compatibility
      if (!match) {
        return [];
      }

      try {
        const recommendedIds = JSON.parse(match[0]);
        
        // Filter available books to get only the recommended ones
        return availableBooks.filter(book => recommendedIds.includes(book.id));
      } catch (error) {
        this.logger.error('Failed to parse OpenAI response', error);
        return [];
      }
    } catch (error) {
      this.logger.error('Error calling OpenAI API', error);
      return [];
    }
  }
}
