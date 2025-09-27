const UserController = require('../controllers/UserController'); 
const { PrismaClient } = require('@prisma/client');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock global para process.env
process.env.KEY_SERVER = 'test-key';

// Mock do PrismaClient (apenas para usuario.create e findUnique)
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    usuario: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

const mockClient = new PrismaClient(); // Usará o mock

// Mock do bcryptjs
jest.mock('bcryptjs', () => ({
  genSaltSync: jest.fn(),
  hashSync: jest.fn(),
  compareSync: jest.fn(),
}));

// Mock do jwt (apenas para sign no login)
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}));

// Mock do console.log para evitar poluição
jest.spyOn(console, 'log').mockImplementation(() => {});

describe('User  Controller - Testes Simples', () => {
  let req, res;

  beforeEach(() => {
    // Mock req
    req = {
      body: {},
      headers: {},
    };

    // Mock res
    res = {
      json: jest.fn(),
    };

    // Limpa mocks entre testes
    jest.clearAllMocks();
  });

  describe('cadastrar (criação de conta)', () => {
    it('deve cadastrar um usuário com sucesso quando todos os dados são fornecidos', async () => {
      // Setup mocks
      const mockSalt = 'mock-salt';
      const mockHash = 'mock-hashed-password';
      const mockUser  = { id: 1, nome: 'João', email: 'joao@example.com', senha: mockHash };

      bcryptjs.genSaltSync.mockReturnValue(mockSalt);
      bcryptjs.hashSync.mockReturnValue(mockHash);
      mockClient.usuario.create.mockResolvedValue(mockUser );

      req.body = { nome: 'João', email: 'joao@example.com', senha: 'senha123' };

      await UserController.cadastrar(req, res);

      expect(console.log).toHaveBeenCalledWith(req.body);
      expect(bcryptjs.genSaltSync).toHaveBeenCalledWith(8);
      expect(bcryptjs.hashSync).toHaveBeenCalledWith('senha123', mockSalt);
      expect(mockClient.usuario.create).toHaveBeenCalledWith({
        data: {
          nome: 'João',
          email: 'joao@example.com',
          senha: mockHash,
        },
      });
      expect(res.json).toHaveBeenCalledWith({ usuarioId: 1 });
    });

    it('deve cadastrar com dados vazios (sem validação no código original)', async () => {
      // O código não valida campos, então testa com body vazio para simular
      const mockSalt = 'mock-salt';
      const mockHash = 'mock-hashed-password';
      const mockUser  = { id: 1 };

      bcryptjs.genSaltSync.mockReturnValue(mockSalt);
      bcryptjs.hashSync.mockReturnValue(mockHash);
      mockClient.usuario.create.mockResolvedValue(mockUser );

      req.body = { nome: '', email: '', senha: '' };

      await UserController.cadastrar(req, res);

      expect(mockClient.usuario.create).toHaveBeenCalledWith({
        data: {
          nome: '',
          email: '',
          senha: mockHash,
        },
      });
      expect(res.json).toHaveBeenCalledWith({ usuarioId: 1 });
      // Sugestão: Adicione validação no controller para retornar erro se campos estiverem vazios.
    });
  });

  describe('login', () => {
    it('deve fazer login com sucesso quando email e senha estão corretos', async () => {
      // Setup mocks
      const mockUser  = { id: 1, email: 'joao@example.com', senha: 'hashed-password' };
      const mockToken = 'mock-jwt-token';

      mockClient.usuario.findUnique.mockResolvedValue(mockUser );
      bcryptjs.compareSync.mockReturnValue(true);
      jwt.sign.mockReturnValue(mockToken);

      req.body = { email: 'joao@example.com', senha: 'senha123' };

      await UserController.login(req, res);

      expect(mockClient.usuario.findUnique).toHaveBeenCalledWith({
        where: { email: 'joao@example.com' },
      });
      expect(bcryptjs.compareSync).toHaveBeenCalledWith('senha123', 'hashed-password');
      expect(jwt.sign).toHaveBeenCalledWith({ id: 1 }, 'test-key', { expiresIn: '1h' });
      expect(res.json).toHaveBeenCalledWith({
        msg: 'Autenticado! :D',
        token: mockToken,
      });
    });

    it('deve retornar erro se usuário não for encontrado', async () => {
      mockClient.usuario.findUnique.mockResolvedValue(null);

      req.body = { email: 'inexistente@example.com', senha: 'senha123' };

      await UserController.login(req, res);

      expect(mockClient.usuario.findUnique).toHaveBeenCalledWith({
        where: { email: 'inexistente@example.com' },
      });
      expect(bcryptjs.compareSync).not.toHaveBeenCalled();
      expect(jwt.sign).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ msg: 'Usuário não encontrado :(' });
    });

    it('deve retornar erro se senha estiver incorreta', async () => {
      const mockUser  = { id: 1, email: 'joao@example.com', senha: 'hashed-password' };

      mockClient.usuario.findUnique.mockResolvedValue(mockUser );
      bcryptjs.compareSync.mockReturnValue(false);

      req.body = { email: 'joao@example.com', senha: 'senha-errada' };

      await UserController.login(req, res);

      expect(bcryptjs.compareSync).toHaveBeenCalledWith('senha-errada', 'hashed-password');
      expect(jwt.sign).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ msg: 'Senha incorreta :(' });
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });
});
