
# Clone do Google Drive

## Objetivo

Este projeto tem como objetivo criar um clone do Google Drive utilizando o framework Django.

## Organização do Projeto

A organização do projeto segue a estrutura padrão do Django, conforme descrito abaixo:

```
clonedrive/
│
├── manage.py        
├── clonedrive/        
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py  
│   └── asgi.py
│
├── files/              
│
│
├── templates/          
│   └── base.html       
│   └── files/          
│       ├── upload.html
│       ├── list.html
│       └── detail.html
 |        ├── static/             
│            └── css/
│                └── styles.css
│
├── media/       
│
├── Makefile           
├── requirements.txt    
└── README.md           
```

## Processo de Instalação

Siga os passos abaixo para instalar e configurar o projeto:

1. **Clone o repositório:**

   ```bash
   git clone https://github.com/ricardoAlmeidaEtic/09_PROJETO_I
   cd 09_PROJETO_I
   ```

2. **Crie e ative um ambiente virtual:**

   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Instale as dependências:**

   ```bash
   pip install -r requirements.txt
   ```

### Utilização do Makefile

Para simplificar os processos de instalação e execução, você pode usar o `Makefile` fornecido. Aqui estão alguns comandos úteis:

- **Instalar dependências:**

  ```bash
  make install
  ```

- **Criar banco de dados e aplicar migrações:**

  ```bash
  make migrate
  ```

- **Criar superuser:**

  ```bash
  make createsuperuser
  ```

- **Executar o servidor de desenvolvimento:**

  ```bash
  make up
  ```